import type { GenieTable } from "./parse-genie";

export type SkillProgressStatus = "not_started" | "in_progress" | "completed";

export type RoadmapProgressEntry = {
  company?: string;
  key: string;
  role?: string;
  skills: Record<string, SkillProgressStatus>;
};

export type StudentProfile = {
  skills: string[];
  cgpa?: string;
  college?: string;
  degree?: string;
  email?: string;
  name?: string;
  targetRole?: string;
  usn?: string;
};

export type StudentContext = StudentProfile & {
  roadmapProgress?: RoadmapProgressEntry[];
};

export type GenieResponse = {
  answer: string;
  company?: string;
  missingSkills: string[];
  prose: string;
  readinessScore: number;
  role?: string;
  tables: GenieTable[];
};

export type RoadmapItem = {
  skill: string;
  resource: string;
  estimated_duration: string;
};

export type RoadmapAgentSkillInput = {
  skill: string;
  course_or_resource: string | null;
  estimated_duration: string | null;
  difficulty_order: number | null;
  status: SkillProgressStatus;
};

export type RoadmapAgentInput = {
  student_id: string;
  skills: RoadmapAgentSkillInput[];
};

export type RoadmapActiveItem = {
  order: number;
  skill: string;
  course: string | null;
  duration: string | null;
  difficulty_order: number | null;
  status: "not_started" | "in_progress";
  note: string;
};

export type RoadmapCompletedItem = {
  skill: string;
  course: string | null;
  status: "completed";
};

export type RoadmapAgentOutput = {
  student_id: string;
  active_sequence: RoadmapActiveItem[];
  completed: RoadmapCompletedItem[];
  summary: string;
};

export type TrackedRoadmap = {
  company?: string;
  id: string;
  plan: RoadmapAgentOutput;
  role?: string;
  updatedAt: number;
};

export type ReadinessData = {
  score: number;
  company?: string;
  role?: string;
};

export type RoadmapData = {
  company?: string;
  items: RoadmapItem[];
  plan?: RoadmapAgentOutput;
  role?: string;
};

export type GenieTablesData = {
  tables: GenieTable[];
};

export function roadmapKey(company?: string, role?: string) {
  return [company?.trim() || "role", role?.trim() || "general"].join("|");
}
