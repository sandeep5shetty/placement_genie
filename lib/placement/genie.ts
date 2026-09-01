import type { GenieResponse, StudentContext } from "./types";

const COMPANY_PATTERN =
  /\b(google|microsoft|amazon|meta|netflix|apple|databricks|uber|linkedin|adobe|salesforce|oracle|ibm|infosys|tcs|wipro|accenture)\b/i;
const ROLE_PATTERN =
  /\b(sde|swe|software engineer|data scientist|data analyst|product analyst|ml engineer|frontend|backend|full[- ]?stack|intern(?:ship)?)\b/i;

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseTarget(question: string) {
  const companyMatch = question.match(COMPANY_PATTERN);
  const roleMatch = question.match(ROLE_PATTERN);
  return {
    company: companyMatch ? titleCase(companyMatch[0]) : undefined,
    role: roleMatch ? titleCase(roleMatch[0]) : undefined,
  };
}

function scoreFromSkills(skills: string[], question: string) {
  const lowered = question.toLowerCase();
  const relevant = skills.filter((skill) => {
    const token = skill.toLowerCase();
    return (
      lowered.includes(token) ||
      ["dsa", "sql", "python", "react", "java", "system design"].some((core) =>
        token.includes(core)
      )
    );
  });
  const base = Math.min(92, 48 + skills.length * 4);
  const bonus = Math.min(12, relevant.length * 3);
  return Math.min(95, base + bonus);
}

/**
 * STUB: Replace this with the Databricks Genie conversation API.
 * Expected contract: send `question` + `studentContext`, receive a
 * natural-language answer and an optional readiness score.
 */
export function queryGenie(
  question: string,
  studentContext: StudentContext
): Promise<GenieResponse> {
  const { company, role } = parseTarget(question);
  const target = [company, role].filter(Boolean).join(" ");
  const skillsLabel =
    studentContext.skills.length > 0
      ? studentContext.skills.slice(0, 8).join(", ")
      : "no confirmed skills yet";
  const intro = studentContext.name
    ? `${studentContext.name}, based on your profile`
    : "Based on your profile";
  const school = studentContext.college
    ? ` ${studentContext.degree ? `${studentContext.degree} at ` : ""}${studentContext.college}.`
    : "";
  const targetPref = studentContext.targetRole
    ? ` Preferred role on file: ${studentContext.targetRole}.`
    : "";
  const cgpaLine = studentContext.cgpa
    ? ` CGPA on file: ${studentContext.cgpa}.`
    : "";
  const score = scoreFromSkills(studentContext.skills, question);

  const answer = [
    target
      ? `${intro}, here is a placement-readiness read for ${target}.`
      : `${intro}, here is a placement-readiness read for this target.`,
    `${school}${targetPref}Confirmed skills: ${skillsLabel}.${cgpaLine}`.trim(),
    score >= 75
      ? "You already cover the core bar for many campus drives. Focus the next 2–3 weeks on interview depth (DSA patterns, SQL case questions, and one system-design walkthrough) rather than adding more tools."
      : "You have a usable foundation, but a few gaps will show up in screening rounds. Close those with a short, ordered plan instead of spreading across too many topics.",
    "I mapped a focused roadmap below. Work it in order and re-check readiness after the first two items.",
  ].join(" ");

  return Promise.resolve({
    answer,
    company,
    readinessScore: score,
    role,
  });
}
