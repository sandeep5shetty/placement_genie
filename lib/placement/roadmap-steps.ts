import type { SkillProgressStatus, TrackedRoadmap } from "./types";

export type RoadmapStepView = {
  course: string | null;
  difficulty_order: number | null;
  duration: string | null;
  guide: string[];
  note: string | null;
  order: number;
  skill: string;
  status: SkillProgressStatus;
};

function actionLine(status: SkillProgressStatus, isCurrent: boolean) {
  if (status === "completed") {
    return "This step is done. Reopen it only if you need to revise the same resource.";
  }
  if (status === "in_progress") {
    return "Finish the listed resource before moving to the next skill.";
  }
  if (isCurrent) {
    return "This is the next skill to work on. Start the listed resource and stay on this step.";
  }
  return "Wait until earlier steps are in progress or complete. Then start this resource.";
}

function buildGuide(input: {
  course: string | null;
  difficulty_order: number | null;
  duration: string | null;
  isCurrent: boolean;
  note: string | null;
  status: SkillProgressStatus;
}) {
  const lines: string[] = [];
  if (input.course) {
    lines.push(`Study this resource: ${input.course}`);
  } else {
    lines.push(
      "No catalog resource is listed for this skill. Use only materials your profile already named."
    );
  }
  if (input.duration) {
    lines.push(`Catalog time for this resource: ${input.duration}.`);
  }
  if (input.difficulty_order !== null) {
    lines.push(
      `Catalog difficulty order is ${input.difficulty_order} (lower numbers come first).`
    );
  }
  lines.push(actionLine(input.status, input.isCurrent));
  if (input.note) {
    lines.push(input.note);
  }
  return lines;
}

export function listRoadmapSteps(roadmap: TrackedRoadmap): RoadmapStepView[] {
  const active = roadmap.plan.active_sequence.map((item) => ({
    course: item.course,
    difficulty_order: item.difficulty_order,
    duration: item.duration,
    note: item.note,
    order: item.order,
    skill: item.skill,
    status: item.status as SkillProgressStatus,
  }));
  const completed = roadmap.plan.completed.map((item, index) => ({
    course: item.course,
    difficulty_order: null as number | null,
    duration: null as string | null,
    note: null as string | null,
    order: roadmap.plan.active_sequence.length + index + 1,
    skill: item.skill,
    status: item.status,
  }));
  const combined = [...active, ...completed];
  const current =
    combined.find((step) => step.status === "in_progress") ??
    combined.find((step) => step.status === "not_started");

  return combined.map((step) => ({
    ...step,
    guide: buildGuide({
      course: step.course,
      difficulty_order: step.difficulty_order,
      duration: step.duration,
      isCurrent: current?.skill === step.skill,
      note: step.note,
      status: step.status,
    }),
  }));
}

export function currentRoadmapStep(steps: RoadmapStepView[]) {
  return (
    steps.find((step) => step.status === "in_progress") ??
    steps.find((step) => step.status === "not_started")
  );
}
