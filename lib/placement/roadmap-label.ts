import type { TrackedRoadmap } from "./types";

export function roadmapLabel(roadmap: { company?: string; role?: string }) {
  const parts = [roadmap.company, roadmap.role].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Skill gaps";
}

export function roadmapProgress(roadmap: TrackedRoadmap) {
  const done = roadmap.plan.completed.length;
  const total = done + roadmap.plan.active_sequence.length;
  return { done, total };
}

export function roadmapPath(id: string) {
  return `/roadmap?open=${encodeURIComponent(id)}`;
}
