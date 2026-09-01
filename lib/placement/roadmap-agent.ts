import { generateObject } from "ai";
import { z } from "zod";
import { titleModel } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { catalogCourseForSkill } from "./catalog-courses";
import type {
  RoadmapActiveItem,
  RoadmapAgentInput,
  RoadmapAgentOutput,
  RoadmapAgentSkillInput,
  RoadmapCompletedItem,
  RoadmapData,
  SkillProgressStatus,
  StudentContext,
} from "./types";
import { roadmapKey } from "./types";

export const ROADMAP_AGENT_PROMPT = `You are the Roadmap Agent for the Placement Readiness Genie system.

## Your job
You receive a student's missing skills, the course/resource data already
retrieved for each skill, and their current progress status. You produce a
single ordered learning roadmap as JSON. You do not fetch data yourself and
you do not have access to any database — everything you need is in the input.

## Hard constraints
1. Use ONLY the data provided in the input. Never invent a course name,
   duration, company, difficulty, or skill that is not present in the input.
2. If a field is missing or null for a skill, output it as null — do not
   estimate or guess a plausible-sounding value.
3. Do not mention any company name unless it appears in the input.
4. Do not make claims about how a completed roadmap will affect placement
   odds, hiring likelihood, or timelines — that is out of scope. Describe
   only what the data says (skill, course, duration, difficulty, status).
5. If the input list of missing skills is empty, return an empty roadmap
   with a short note that no gap exists — do not fabricate a stretch goal.

## Sequencing rules
- Order skills by \`difficulty_order\` ascending (lowest = do first).
- If two skills tie on difficulty_order, order by shortest
  \`estimated_duration\` first.
- If a skill's status is already "completed", place it at the end of the
  list under a separate "done" section rather than the active sequence.
- If a skill's status is "in_progress", it stays first regardless of
  difficulty_order (finish what's started).

## Output format
Return ONLY valid JSON matching this shape, no prose outside the JSON:

{
  "student_id": string,
  "active_sequence": [
    {
      "order": number,
      "skill": string,
      "course": string,
      "duration": string,
      "difficulty_order": number,
      "status": "not_started" | "in_progress",
      "note": string
    }
  ],
  "completed": [
    { "skill": string, "course": string, "status": "completed" }
  ],
  "summary": string
}

Notes must be one short sentence, factual only, under 20 words.
Summary must be one sentence, factual, under 25 words, no motivational filler.`;

const agentOutputSchema = z.object({
  active_sequence: z.array(
    z.object({
      course: z.string().nullable(),
      difficulty_order: z.number().nullable(),
      duration: z.string().nullable(),
      note: z.string(),
      order: z.number(),
      skill: z.string(),
      status: z.enum(["not_started", "in_progress"]),
    })
  ),
  completed: z.array(
    z.object({
      course: z.string().nullable(),
      skill: z.string(),
      status: z.literal("completed"),
    })
  ),
  student_id: z.string(),
  summary: z.string(),
});

function durationDays(value: string | null) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }
  const match = /(\d+(?:\.\d+)?)\s*(day|week|month)/i.exec(value);
  if (!match) {
    return Number.POSITIVE_INFINITY;
  }
  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? "day";
  if (unit.startsWith("week")) {
    return amount * 7;
  }
  if (unit.startsWith("month")) {
    return amount * 30;
  }
  return amount;
}

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function clipWords(value: string, max: number) {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length <= max) {
    return value.trim();
  }
  return `${words.slice(0, max).join(" ")}.`;
}

function sortActive(
  left: RoadmapAgentSkillInput,
  right: RoadmapAgentSkillInput
) {
  const leftDiff = left.difficulty_order ?? 999;
  const rightDiff = right.difficulty_order ?? 999;
  if (leftDiff !== rightDiff) {
    return leftDiff - rightDiff;
  }
  return (
    durationDays(left.estimated_duration) -
    durationDays(right.estimated_duration)
  );
}

function factualNote(skill: RoadmapAgentSkillInput) {
  if (skill.course_or_resource && skill.estimated_duration) {
    return `Listed resource takes ${skill.estimated_duration}.`;
  }
  if (skill.course_or_resource) {
    return `Catalog lists a resource for ${skill.skill}.`;
  }
  return `No course is listed for ${skill.skill}.`;
}

function factualSummary(
  input: RoadmapAgentInput,
  active: RoadmapAgentSkillInput[]
) {
  if (input.skills.length === 0) {
    return "No skill gap exists in the provided input.";
  }
  if (active.length === 0) {
    return "Every listed skill is marked completed.";
  }
  const names = active.map((skill) => skill.skill).join(", ");
  const [first] = active;
  const duration = first?.estimated_duration;
  if (active.length === 1 && duration) {
    return `One skill gap remaining: ${names}, estimated ${duration}.`;
  }
  if (active.length === 1) {
    return `One skill gap remaining: ${names}.`;
  }
  return clipWords(`${active.length} skill gaps remaining: ${names}.`, 24);
}

export function sequenceRoadmap(input: RoadmapAgentInput): RoadmapAgentOutput {
  if (input.skills.length === 0) {
    return {
      active_sequence: [],
      completed: [],
      student_id: input.student_id,
      summary: "No skill gap exists in the provided input.",
    };
  }

  const completedSkills = input.skills.filter(
    (skill) => skill.status === "completed"
  );
  const inProgress = input.skills.filter(
    (skill) => skill.status === "in_progress"
  );
  const notStarted = input.skills.filter(
    (skill) => skill.status === "not_started"
  );
  const ordered = [...inProgress, ...[...notStarted].sort(sortActive)];

  const active_sequence: RoadmapActiveItem[] = ordered.map((skill, index) => ({
    course: skill.course_or_resource,
    difficulty_order: skill.difficulty_order,
    duration: skill.estimated_duration,
    note: factualNote(skill),
    order: index + 1,
    skill: skill.skill,
    status: skill.status === "in_progress" ? "in_progress" : "not_started",
  }));

  const completed: RoadmapCompletedItem[] = completedSkills.map((skill) => ({
    course: skill.course_or_resource,
    skill: skill.skill,
    status: "completed",
  }));

  return {
    active_sequence,
    completed,
    student_id: input.student_id,
    summary: factualSummary(input, ordered),
  };
}

function inputBySkill(input: RoadmapAgentInput) {
  const map = new Map<string, RoadmapAgentSkillInput>();
  for (const skill of input.skills) {
    map.set(skill.skill.toLowerCase(), skill);
  }
  return map;
}

function mentionsUnknownCompany(text: string, inputJson: string) {
  const names = [
    "amazon",
    "google",
    "microsoft",
    "meta",
    "netflix",
    "apple",
    "databricks",
    "uber",
    "linkedin",
    "adobe",
    "salesforce",
    "oracle",
    "ibm",
    "infosys",
    "tcs",
    "wipro",
    "accenture",
    "honeywell",
    "cognizant",
    "capgemini",
    "flipkart",
    "phonepe",
    "intuit",
  ];
  const haystack = inputJson.toLowerCase();
  const body = text.toLowerCase();
  for (const name of names) {
    if (body.includes(name) && !haystack.includes(name)) {
      return true;
    }
  }
  return false;
}

function mergeAgentNotes(
  sequenced: RoadmapAgentOutput,
  generated: z.infer<typeof agentOutputSchema>,
  input: RoadmapAgentInput
): RoadmapAgentOutput {
  const inputJson = JSON.stringify(input);
  const notes = new Map<string, string>();
  for (const item of generated.active_sequence) {
    const source = inputBySkill(input).get(item.skill.toLowerCase());
    if (!source) {
      continue;
    }
    const note = clipWords(item.note.trim(), 19);
    if (
      wordCount(note) === 0 ||
      mentionsUnknownCompany(note, inputJson) ||
      /hire|placement odds|likely|guarantee|interview chance/i.test(note)
    ) {
      continue;
    }
    notes.set(item.skill.toLowerCase(), note);
  }

  let { summary } = sequenced;
  const generatedSummary = clipWords(generated.summary.trim(), 24);
  if (
    generatedSummary &&
    !mentionsUnknownCompany(generatedSummary, inputJson) &&
    !/hire|placement odds|likely|guarantee/i.test(generatedSummary)
  ) {
    summary = generatedSummary;
  }

  return {
    ...sequenced,
    active_sequence: sequenced.active_sequence.map((item) => ({
      ...item,
      note: notes.get(item.skill.toLowerCase()) ?? item.note,
    })),
    summary,
  };
}

async function decorateWithAgent(
  input: RoadmapAgentInput,
  sequenced: RoadmapAgentOutput
): Promise<RoadmapAgentOutput> {
  if (input.skills.length === 0) {
    return sequenced;
  }
  try {
    const { object } = await generateObject({
      model: getLanguageModel(titleModel.id),
      prompt: `${ROADMAP_AGENT_PROMPT}\n\nInput:\n${JSON.stringify(input)}`,
      schema: agentOutputSchema,
    });
    return mergeAgentNotes(sequenced, object, input);
  } catch {
    return sequenced;
  }
}

function statusForSkill(
  skill: string,
  progress?: Record<string, SkillProgressStatus>
): SkillProgressStatus {
  const stored = progress?.[skill] ?? progress?.[skill.toLowerCase()];
  if (
    stored === "not_started" ||
    stored === "in_progress" ||
    stored === "completed"
  ) {
    return stored;
  }
  return "not_started";
}

function progressForTarget(
  studentContext: StudentContext,
  company?: string,
  role?: string
) {
  const key = roadmapKey(company, role);
  const match = studentContext.roadmapProgress?.find(
    (entry) => entry.key === key
  );
  return match?.skills;
}

export function buildRoadmapAgentInput({
  missingSkills,
  studentContext,
  company,
  role,
}: {
  missingSkills: string[];
  studentContext: StudentContext;
  company?: string;
  role?: string;
}): RoadmapAgentInput {
  const progress = progressForTarget(studentContext, company, role);
  const student_id = studentContext.usn?.trim() || "profile";
  const uniqueMissing = [
    ...new Set(missingSkills.map((skill) => skill.trim())),
  ].filter(Boolean);

  const skills: RoadmapAgentSkillInput[] = [];
  const seen = new Set<string>();

  for (const skill of uniqueMissing) {
    const token = skill.toLowerCase();
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    const catalog = catalogCourseForSkill(skill);
    skills.push({
      course_or_resource: catalog?.course_or_resource ?? null,
      difficulty_order: catalog?.difficulty_order ?? null,
      estimated_duration: catalog?.estimated_duration ?? null,
      skill,
      status: statusForSkill(skill, progress),
    });
  }

  if (progress) {
    for (const [skill, status] of Object.entries(progress)) {
      if (status !== "completed") {
        continue;
      }
      if (seen.has(skill.toLowerCase())) {
        continue;
      }
      seen.add(skill.toLowerCase());
      const catalog = catalogCourseForSkill(skill);
      skills.push({
        course_or_resource: catalog?.course_or_resource ?? null,
        difficulty_order: catalog?.difficulty_order ?? null,
        estimated_duration: catalog?.estimated_duration ?? null,
        skill,
        status: "completed",
      });
    }
  }

  return { skills, student_id };
}

export function planToItems(plan: RoadmapAgentOutput) {
  return plan.active_sequence.map((item) => ({
    estimated_duration: item.duration ?? "",
    resource: item.course ?? "No catalog resource listed",
    skill: item.skill,
  }));
}

export async function runRoadmapAgent({
  missingSkills,
  studentContext,
  company,
  role,
}: {
  missingSkills: string[];
  studentContext: StudentContext;
  company?: string;
  role?: string;
}): Promise<RoadmapData> {
  const input = buildRoadmapAgentInput({
    company,
    missingSkills,
    role,
    studentContext,
  });
  const sequenced = sequenceRoadmap(input);
  const plan = await decorateWithAgent(input, sequenced);
  return {
    company,
    items: planToItems(plan),
    plan,
    role,
  };
}

export function applyRoadmapStatus(
  plan: RoadmapAgentOutput,
  skill: string,
  status: SkillProgressStatus
): RoadmapAgentOutput {
  const combined = [
    ...plan.active_sequence.map((item) => ({
      skill: item.skill,
      status: item.status,
    })),
    ...plan.completed.map((item) => ({
      skill: item.skill,
      status: item.status,
    })),
  ];
  const inputSkills: RoadmapAgentSkillInput[] = combined.map((item) => {
    const catalog = catalogCourseForSkill(item.skill);
    const nextStatus = item.skill === skill ? status : item.status;
    return {
      course_or_resource: catalog?.course_or_resource ?? null,
      difficulty_order: catalog?.difficulty_order ?? null,
      estimated_duration: catalog?.estimated_duration ?? null,
      skill: item.skill,
      status: nextStatus,
    };
  });
  return sequenceRoadmap({
    skills: inputSkills,
    student_id: plan.student_id,
  });
}
