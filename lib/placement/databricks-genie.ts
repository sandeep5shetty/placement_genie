import type { StudentContext } from "./types";

type JsonObject = {
  [key: string]: JsonValue;
};
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

const conversationsByChat = new Map<string, string>();

function isRecord(value: JsonValue | undefined): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function workspaceHost() {
  const host = process.env.DATABRICKS_HOST?.trim().replace(/\/$/, "");
  const token = process.env.DATABRICKS_TOKEN?.trim();
  const agentId = process.env.DATABRICKS_GENIE_AGENT_ID?.trim();
  if (!(host && token && agentId)) {
    return null;
  }
  return { agentId, host, token };
}

export function isGenieConfigured() {
  return workspaceHost() !== null;
}

export function buildGeniePrompt(
  question: string,
  studentContext: StudentContext
) {
  const lines = [
    "You are answering for ONE logged-in student. Never substitute another student from the tables.",
    "Name what is met and what is missing, using exact skill names.",
    "A student meets the CGPA bar if their CGPA >= the role min_cgpa.",
    "Skill match % = count of required skills whose exact name appears in the profile skills list, divided by total required skills.",
    "Match skills by name only (case-insensitive). OS is not System Design. DBMS is not SQL. Do not invent equivalences.",
    "Never report 100% skill match if any required skill is absent from the profile list.",
    "A student is fully ready only when CGPA meets min_cgpa AND skill match is 100%.",
    "Do not emit citation markers such as ]] or \\]. Do not append suggested follow-up questions.",
    "After any tables, write a short summary. Do not restate every table row.",
    studentContext.usn
      ? `Look up campus.placement.students only for student_id = ${studentContext.usn}. If table CGPA/skills differ from this profile, use the profile values.`
      : "Do not look up any row in the students table. Compute readiness from this profile against companies (and placement_drives / skill_courses as needed).",
    "",
    "Authoritative profile for this request:",
    studentContext.usn
      ? `- usn / student_id: ${studentContext.usn}`
      : "- usn / student_id: not provided",
    studentContext.name
      ? `- name: ${studentContext.name}`
      : "- name: not provided",
    studentContext.cgpa
      ? `- cgpa: ${studentContext.cgpa}`
      : "- cgpa: not provided",
    studentContext.college ? `- college: ${studentContext.college}` : null,
    studentContext.degree ? `- degree: ${studentContext.degree}` : null,
    studentContext.email ? `- email: ${studentContext.email}` : null,
    studentContext.targetRole
      ? `- target_role: ${studentContext.targetRole}`
      : null,
    `- skills: ${studentContext.skills.join(", ") || "none listed"}`,
    "",
    `Question: ${question}`,
  ];
  return lines.filter((line) => line !== null).join("\n");
}

function collectText(value: JsonValue, acc: string[]) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectText(item, acc);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  if (value.type === "output_text" && typeof value.text === "string") {
    const trimmed = value.text.trim();
    if (trimmed.length > 0) {
      acc.push(trimmed);
    }
    return;
  }
  if (
    value.type === "function_call_output" &&
    typeof value.output === "string"
  ) {
    const trimmed = value.output.trim();
    if (trimmed.length > 0) {
      acc.push(trimmed);
    }
  }
  const nestedKeys = ["content", "item", "output", "response", "data"];
  for (const key of nestedKeys) {
    const nested = value[key];
    if (nested !== undefined && key !== "output") {
      collectText(nested, acc);
    } else if (key === "output" && value.type !== "function_call_output") {
      collectText(nested, acc);
    }
  }
}

function conversationIdFrom(payload: JsonValue): string | undefined {
  if (!isRecord(payload)) {
    return;
  }
  const { conversation_id: directId, response } = payload;
  const direct = asString(directId);
  if (direct) {
    return direct;
  }
  if (isRecord(response)) {
    return asString(response.conversation_id);
  }
}

function isFailed(payload: JsonValue) {
  if (!isRecord(payload)) {
    return false;
  }
  const { response, status } = payload;
  if (status === "failed") {
    return true;
  }
  return isRecord(response) && response.status === "failed";
}

function errorMessage(payload: JsonValue) {
  if (!isRecord(payload)) {
    return "Genie request failed.";
  }
  const { error, response } = payload;
  if (isRecord(error)) {
    return asString(error.message) ?? "Genie request failed.";
  }
  if (isRecord(response) && isRecord(response.error)) {
    return asString(response.error.message) ?? "Genie request failed.";
  }
  return "Genie request failed.";
}

function parseSseBlock(block: string) {
  let eventName = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) {
    return null;
  }
  return { data: dataLines.join("\n"), eventName };
}

async function readChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  buffer: string,
  texts: string[],
  conversationId: string | undefined
): Promise<{ conversationId?: string; texts: string[] }> {
  const { done, value } = await reader.read();
  const nextBuffer = done
    ? buffer + decoder.decode()
    : buffer + decoder.decode(value, { stream: true });
  const parts = nextBuffer.split("\n\n");
  const remainder = done ? "" : (parts.pop() ?? "");
  let nextConversation = conversationId;
  const nextTexts = [...texts];

  for (const block of parts) {
    const parsed = parseSseBlock(block.trim());
    if (!parsed) {
      continue;
    }
    let payload: JsonValue;
    try {
      payload = JSON.parse(parsed.data) as JsonValue;
    } catch {
      continue;
    }
    nextConversation = conversationIdFrom(payload) ?? nextConversation;
    if (parsed.eventName === "response.failed" || isFailed(payload)) {
      throw new Error(errorMessage(payload));
    }
    if (
      parsed.eventName === "response.completed" ||
      parsed.eventName === "response.output_item.done"
    ) {
      collectText(payload, nextTexts);
    }
  }

  if (done) {
    return { conversationId: nextConversation, texts: nextTexts };
  }
  return readChunk(reader, decoder, remainder, nextTexts, nextConversation);
}

export async function askGenieAgent({
  conversationKey,
  question,
  studentContext,
}: {
  conversationKey?: string;
  question: string;
  studentContext: StudentContext;
}) {
  const config = workspaceHost();
  if (!config) {
    throw new Error("Databricks Genie is not configured.");
  }

  const conversationId = conversationKey
    ? conversationsByChat.get(conversationKey)
    : undefined;
  const body: JsonObject = {
    input: [
      {
        content: [
          {
            text: buildGeniePrompt(question, studentContext),
            type: "input_text",
          },
        ],
        role: "user",
        type: "message",
      },
    ],
  };
  if (conversationId) {
    body.conversation_id = conversationId;
  }

  const response = await fetch(
    `${config.host}/api/2.0/genie/agents/${config.agentId}/responses`,
    {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Genie Agent HTTP ${response.status}: ${detail.slice(0, 400)}`
    );
  }

  if (!response.body) {
    throw new Error("Genie Agent returned an empty stream.");
  }

  const result = await readChunk(
    response.body.getReader(),
    new TextDecoder(),
    "",
    [],
    conversationId
  );

  if (conversationKey && result.conversationId) {
    conversationsByChat.set(conversationKey, result.conversationId);
  }

  const unique = [...new Set(result.texts)];
  const answer = unique.join("\n\n").trim();
  if (!answer) {
    throw new Error("Genie Agent completed without an answer.");
  }
  return answer;
}
