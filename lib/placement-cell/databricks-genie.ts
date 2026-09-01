import "server-only";

import { parseAnalyticsAnswer } from "./parse-analytics";
import { buildPlacementCellPrompt } from "./prompts";
import type { PlacementCellGenieResponse } from "./types";

type JsonObject = {
  [key: string]: JsonValue;
};
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

const conversations = new Map<string, string>();

function isRecord(value: JsonValue | undefined): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function workspaceConfig() {
  const host =
    process.env.PLACEMENT_CELL_DATABRICKS_HOST?.trim().replace(/\/$/, "") ??
    process.env.DATABRICKS_HOST?.trim().replace(/\/$/, "");
  const token =
    process.env.PLACEMENT_CELL_DATABRICKS_TOKEN?.trim() ??
    process.env.DATABRICKS_TOKEN?.trim();
  const agentId =
    process.env.PLACEMENT_CELL_GENIE_AGENT_ID?.trim() ??
    process.env.DATABRICKS_GENIE_AGENT_ID?.trim();

  if (!(host && token && agentId)) {
    return null;
  }

  return { agentId, host, token };
}

export function isPlacementCellGenieConfigured() {
  return workspaceConfig() !== null;
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

  const direct = asString(payload.conversation_id);
  if (direct) {
    return direct;
  }

  if (isRecord(payload.response)) {
    return asString(payload.response.conversation_id);
  }
}

function isFailed(payload: JsonValue) {
  if (!isRecord(payload)) {
    return false;
  }

  if (payload.status === "failed") {
    return true;
  }

  return isRecord(payload.response) && payload.response.status === "failed";
}

function errorMessage(payload: JsonValue) {
  if (!isRecord(payload)) {
    return "Placement Cell Genie request failed.";
  }

  if (isRecord(payload.error)) {
    return (
      asString(payload.error.message) ?? "Placement Cell Genie request failed."
    );
  }

  if (isRecord(payload.response) && isRecord(payload.response.error)) {
    return (
      asString(payload.response.error.message) ??
      "Placement Cell Genie request failed."
    );
  }

  return "Placement Cell Genie request failed.";
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

export async function askPlacementCellGenie({
  conversationKey,
  question,
}: {
  conversationKey?: string;
  question: string;
}): Promise<PlacementCellGenieResponse> {
  const config = workspaceConfig();
  if (!config) {
    throw new Error("Placement Cell Genie is not configured.");
  }

  const conversationId = conversationKey
    ? conversations.get(conversationKey)
    : undefined;

  const body: JsonObject = {
    input: [
      {
        content: [
          {
            text: buildPlacementCellPrompt(question),
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
      `Placement Cell Genie HTTP ${response.status}: ${detail.slice(0, 400)}`
    );
  }

  if (!response.body) {
    throw new Error("Placement Cell Genie returned an empty stream.");
  }

  const result = await readChunk(
    response.body.getReader(),
    new TextDecoder(),
    "",
    [],
    conversationId
  );

  if (conversationKey && result.conversationId) {
    conversations.set(conversationKey, result.conversationId);
  }

  const unique = [...new Set(result.texts)];
  const answer = unique.join("\n\n").trim();

  if (!answer) {
    throw new Error("Placement Cell Genie completed without an answer.");
  }

  const parsed = parseAnalyticsAnswer(answer);

  return {
    answer: parsed.prose || answer,
    conversationId: result.conversationId,
    queryResults: parsed.queryResults,
    status: "completed",
    suggestedQuestions: parsed.suggestedQuestions,
  };
}
