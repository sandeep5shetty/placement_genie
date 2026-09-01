import type { GenieResponse, RoadmapItem } from "./types";

const RESOURCE_BY_SKILL: Record<string, { resource: string; weeks: string }> = {
  dsa: {
    resource: "NeetCode 150 + campus contest set",
    weeks: "2 weeks",
  },
  java: {
    resource: "Java collections + OOP interview drills",
    weeks: "1 week",
  },
  "node.js": {
    resource: "Node/Express REST service with auth and tests",
    weeks: "1 week",
  },
  python: {
    resource: "Python for interviews (functions, pandas, complexity)",
    weeks: "1 week",
  },
  react: {
    resource: "Build one production-style CRUD app and explain it",
    weeks: "1 week",
  },
  sql: {
    resource: "Mode SQL tutorial + 20 interview questions",
    weeks: "1 week",
  },
  "system design": {
    resource: "Grokking a few campus-level designs (URL shortener, feed)",
    weeks: "1 week",
  },
};

const DEFAULT_ITEMS: RoadmapItem[] = [
  {
    estimated_duration: "2 weeks",
    resource: "NeetCode 150 — arrays, hashing, two pointers, trees",
    skill: "DSA",
  },
  {
    estimated_duration: "1 week",
    resource: "SQL interview kit — joins, window functions, CTEs",
    skill: "SQL",
  },
  {
    estimated_duration: "4 days",
    resource: "Behavioral STAR stories mapped to the target role",
    skill: "Interview communication",
  },
];

/**
 * STUB: Replace this with a Databricks/agent workflow that turns a
 * Genie answer + confirmed skills into a sequenced study plan.
 */
export function generateRoadmap(
  genieResponse: GenieResponse,
  skills: string[]
): Promise<RoadmapItem[]> {
  const mapped: RoadmapItem[] = [];
  const seen = new Set<string>();

  for (const skill of skills) {
    const key = skill.toLowerCase();
    const match = Object.entries(RESOURCE_BY_SKILL).find(([token]) =>
      key.includes(token)
    );
    if (!match || seen.has(match[0])) {
      continue;
    }
    seen.add(match[0]);
    mapped.push({
      estimated_duration: match[1].weeks,
      resource: match[1].resource,
      skill,
    });
  }

  if (mapped.length === 0) {
    return Promise.resolve(
      DEFAULT_ITEMS.map((item) => ({
        ...item,
        resource: genieResponse.role
          ? `${item.resource} (for ${genieResponse.role})`
          : item.resource,
      }))
    );
  }

  if (!mapped.some((item) => item.skill.toLowerCase().includes("dsa"))) {
    mapped.unshift(DEFAULT_ITEMS[0]);
  }

  return Promise.resolve(mapped.slice(0, 5));
}
