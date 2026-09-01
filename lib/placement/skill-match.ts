import type { GenieTable, ParsedGenieAnswer } from "./parse-genie";
import type { StudentContext } from "./types";

export type LocalSkillMatch = {
  have: string[];
  missing: string[];
  required: string[];
  score: number;
};

const ALIAS: Record<string, string> = {
  "c++": "cpp",
  cpp: "cpp",
  "data structures": "dsa",
  "data structures and algorithms": "dsa",
  dsa: "dsa",
  javascript: "javascript",
  js: "javascript",
  "next.js": "nextjs",
  nextjs: "nextjs",
  node: "nodejs",
  "node.js": "nodejs",
  nodejs: "nodejs",
  "operating system": "os",
  "operating systems": "os",
  os: "os",
  postgres: "postgresql",
  postgresql: "postgresql",
  react: "react",
  "react.js": "react",
  reactjs: "react",
  "system design": "system design",
  ts: "typescript",
  typescript: "typescript",
};

function normalizeHeader(header: string) {
  return header.toLowerCase().replaceAll(" ", "_");
}

function canonical(skill: string) {
  const normalized = skill.trim().toLowerCase().replaceAll(/\s+/g, " ");
  return ALIAS[normalized] ?? normalized;
}

export function splitSkillList(value: string) {
  return value
    .split(/[,;/|]/)
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0);
}

function profileHasRequired(profileSkills: string[], required: string) {
  const need = canonical(required);
  for (const listed of profileSkills) {
    const have = canonical(listed);
    if (have === need) {
      return true;
    }
    if (need === "react" && have === "react native") {
      return true;
    }
  }
  return false;
}

export function matchSkills(
  profileSkills: string[],
  requiredSkills: string[]
): LocalSkillMatch {
  const have: string[] = [];
  const missing: string[] = [];
  for (const required of requiredSkills) {
    if (profileHasRequired(profileSkills, required)) {
      have.push(required);
    } else {
      missing.push(required);
    }
  }
  const score =
    requiredSkills.length === 0
      ? 0
      : Math.round((have.length / requiredSkills.length) * 100);
  return { have, missing, required: requiredSkills, score };
}

export function requiredSkillsFromTables(tables: GenieTable[]) {
  for (const table of tables) {
    const headers = table.headers.map(normalizeHeader);
    const index = headers.findIndex(
      (header) => header === "required_skills" || header === "required_skill"
    );
    if (index < 0) {
      continue;
    }
    const cell = table.rows.at(0)?.at(index);
    if (!cell) {
      continue;
    }
    const skills = splitSkillList(cell);
    if (skills.length > 1 || (skills.length === 1 && cell.includes(","))) {
      return skills;
    }
    if (skills.length === 1 && table.rows.length === 1) {
      return skills;
    }
  }
  return [];
}

function minCgpaFromTables(tables: GenieTable[]) {
  for (const table of tables) {
    const headers = table.headers.map(normalizeHeader);
    const index = headers.findIndex(
      (header) => header === "min_cgpa" || header === "required_cgpa"
    );
    if (index < 0) {
      continue;
    }
    const raw = table.rows.at(0)?.at(index);
    const value = raw ? Number(raw) : Number.NaN;
    if (!Number.isNaN(value)) {
      return value;
    }
  }
}

function skillGapTable(match: LocalSkillMatch): GenieTable {
  return {
    headers: ["required skill", "status"],
    rows: match.required.map((skill) => [
      skill,
      match.missing.includes(skill) ? "MISSING" : "HAS",
    ]),
  };
}

function isSkillGapTable(table: GenieTable) {
  const headers = table.headers.map(normalizeHeader);
  const hasSkill = headers.some(
    (header) => header === "required_skill" || header === "skill"
  );
  const hasStatus = headers.some(
    (header) =>
      header === "status" ||
      header === "skill_status" ||
      (header.endsWith("_status") && !header.includes("cgpa"))
  );
  return hasSkill && hasStatus && table.rows.length > 0;
}

function buildProse({
  cgpa,
  company,
  match,
  minCgpa,
  role,
}: {
  cgpa?: number;
  company?: string;
  match: LocalSkillMatch;
  minCgpa?: number;
  role?: string;
}) {
  const target = [company, role].filter(Boolean).join(" ");
  const label = target || "this role";
  let cgpaLine: string | null = null;
  if (cgpa !== undefined && minCgpa !== undefined) {
    cgpaLine =
      cgpa >= minCgpa
        ? `CGPA ${cgpa} meets the ${minCgpa} cutoff.`
        : `CGPA ${cgpa} is below the ${minCgpa} cutoff.`;
  }
  const haveLine =
    match.have.length > 0
      ? `Skills you have: ${match.have.join(", ")}.`
      : "None of the required skills are on your profile.";
  const missingNote = match.missing.some(
    (skill) => canonical(skill) === "system design"
  )
    ? " OS on a resume does not count as System Design."
    : "";
  const missingLine =
    match.missing.length > 0
      ? `Missing: ${match.missing.join(", ")}.${missingNote}`
      : "No required skills are missing.";
  const ready =
    (cgpa === undefined || minCgpa === undefined || cgpa >= minCgpa) &&
    match.missing.length === 0;
  const headline = ready
    ? `You meet the listed bar for ${label}.`
    : `You are not fully ready for ${label}.`;
  return [
    headline,
    cgpaLine,
    haveLine,
    missingLine,
    `Skill match: ${match.score}%.`,
  ]
    .filter((line) => line !== null)
    .join(" ");
}

export function applyLocalReadiness(
  parsed: ParsedGenieAnswer,
  studentContext: StudentContext
): ParsedGenieAnswer {
  const required = requiredSkillsFromTables(parsed.tables);
  if (required.length === 0) {
    return parsed;
  }

  const match = matchSkills(studentContext.skills, required);
  const minCgpa = minCgpaFromTables(parsed.tables);
  const cgpa = studentContext.cgpa ? Number(studentContext.cgpa) : Number.NaN;
  const tables = [
    ...parsed.tables.filter((table) => !isSkillGapTable(table)),
    skillGapTable(match),
  ];

  return {
    ...parsed,
    missingSkills: match.missing,
    prose: buildProse({
      cgpa: Number.isNaN(cgpa) ? undefined : cgpa,
      company: parsed.company,
      match,
      minCgpa,
      role: parsed.role,
    }),
    score: match.score,
    tables,
  };
}
