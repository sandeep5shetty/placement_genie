export type StudentContext = {
  skills: string[];
  cgpa?: string;
  name?: string;
  email?: string;
  college?: string;
  degree?: string;
  targetRole?: string;
};

export type StudentProfile = StudentContext;

export type GenieResponse = {
  answer: string;
  readinessScore: number;
  company?: string;
  role?: string;
};

export type RoadmapItem = {
  skill: string;
  resource: string;
  estimated_duration: string;
};

export type ReadinessData = {
  score: number;
  company?: string;
  role?: string;
};

export type RoadmapData = {
  items: RoadmapItem[];
};
