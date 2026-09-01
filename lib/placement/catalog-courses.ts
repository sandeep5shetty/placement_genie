import type { SkillCourse } from "./data/schema";
import { skillCourses } from "./data/skill-courses";

function durationDays(value: string) {
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

function rankCourses(left: SkillCourse, right: SkillCourse) {
  if (left.difficulty_order !== right.difficulty_order) {
    return left.difficulty_order - right.difficulty_order;
  }
  return (
    durationDays(left.estimated_duration) -
    durationDays(right.estimated_duration)
  );
}

export function catalogCourseForSkill(skill: string): SkillCourse | null {
  const needle = skill.trim().toLowerCase();
  const exact = skillCourses.filter(
    (course) => course.skill.toLowerCase() === needle
  );
  if (exact.length > 0) {
    const ranked = [...exact].sort(rankCourses);
    return ranked[0] ?? null;
  }
  const loose = skillCourses.filter(
    (course) =>
      needle.includes(course.skill.toLowerCase()) ||
      course.skill.toLowerCase().includes(needle)
  );
  if (loose.length === 0) {
    return null;
  }
  const ranked = [...loose].sort(rankCourses);
  return ranked[0] ?? null;
}
