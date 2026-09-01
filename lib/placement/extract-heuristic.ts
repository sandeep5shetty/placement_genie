import { extractCgpaFromText } from "./extract-cgpa";
import { extractUsnFromText } from "./extract-usn";
import type { StudentProfile } from "./types";

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const SKILL_TOKENS = [
  "System Design",
  "React Native",
  "Node.js",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "PostgreSQL",
  "MongoDB",
  "Spark",
  "Python",
  "React",
  "Java",
  "SQL",
  "DSA",
  "DBMS",
  "C++",
  "HTML",
  "CSS",
  "AWS",
  "Git",
  "OS",
];

function cleanOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function extractEmail(text: string) {
  return EMAIL.exec(text)?.[0];
}

function extractName(text: string, email?: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 12)) {
    if (EMAIL.test(line) || extractUsnFromText(line) || /\d/.test(line)) {
      continue;
    }
    if (line.length < 3 || line.length > 60) {
      continue;
    }
    if (/resume|curriculum|objective|profile|skills|education/i.test(line)) {
      continue;
    }
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      return line;
    }
  }
  const local = email?.split("@")[0]?.replaceAll(/[._]/g, " ");
  return local
    ? local.replace(/\b\w/g, (char) => char.toUpperCase())
    : undefined;
}

function extractCollege(text: string) {
  const match =
    /([A-Z][A-Za-z .,&-]{8,80}(?:College|University|Institute)[A-Za-z .,&-]{0,40})/.exec(
      text
    );
  return match?.[1]?.trim();
}

function extractDegree(text: string) {
  const match =
    /\b(B\.?Tech|B\.?E\.?|M\.?Tech|MCA|MBA|BCA|B\.?Sc)(?:\s*[.\-in]*\s*[A-Za-z& ]{0,40})?/i.exec(
      text
    );
  return match?.[0]?.trim();
}

function extractSkills(text: string) {
  const lowered = text.toLowerCase();
  const found: string[] = [];
  for (const skill of SKILL_TOKENS) {
    if (lowered.includes(skill.toLowerCase())) {
      found.push(skill);
    }
  }
  return found;
}

export function extractProfileHeuristically(text: string): StudentProfile {
  const email = extractEmail(text);
  return {
    cgpa: extractCgpaFromText(text),
    college: cleanOptional(extractCollege(text)),
    degree: cleanOptional(extractDegree(text)),
    email: cleanOptional(email),
    name: cleanOptional(extractName(text, email)),
    skills: extractSkills(text).slice(0, 24),
    usn: extractUsnFromText(text),
  };
}

export function mergeProfiles(
  primary: StudentProfile,
  fallback: StudentProfile
): StudentProfile {
  return {
    cgpa: primary.cgpa ?? fallback.cgpa,
    college: primary.college ?? fallback.college,
    degree: primary.degree ?? fallback.degree,
    email: primary.email ?? fallback.email,
    name: primary.name ?? fallback.name,
    skills:
      primary.skills.length > 0
        ? [...new Set([...primary.skills, ...fallback.skills])].slice(0, 24)
        : fallback.skills,
    targetRole: primary.targetRole ?? fallback.targetRole,
    usn: primary.usn ?? fallback.usn,
  };
}

export function profileHasDetails(profile: StudentProfile) {
  return Boolean(
    profile.skills.length > 0 ||
      profile.cgpa ||
      profile.name ||
      profile.usn ||
      profile.email
  );
}
