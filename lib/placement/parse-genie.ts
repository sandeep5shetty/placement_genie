export type GenieTable = {
  headers: string[];
  rows: string[][];
};

export type ParsedGenieAnswer = {
  company?: string;
  missingSkills: string[];
  prose: string;
  role?: string;
  score: number;
  tables: GenieTable[];
};

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const SEPARATOR = /^\s*\|?\s*:?-{3,}/;
const MATCH_PERCENT = /skill match[^%\d]{0,48}(\d+(?:\.\d+)?)\s*%/i;
const CITATION = /\[\[[^\]]*\]\([^)]*\)\]?/g;
const FOLLOW_UP_CHUNK =
  /(?:^|\n)\s*(?:(?:Get|Analyze|Show|List|Find|Compare|Check)\b[^\n.]{6,90}\s*){2,}/gi;

function splitCells(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparator(line: string) {
  return SEPARATOR.test(line.replaceAll(" ", ""));
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replaceAll(" ", "_");
}

function isLearningTable(table: GenieTable) {
  const joined = table.headers.map(normalizeHeader).join(" ");
  return (
    joined.includes("course") ||
    joined.includes("resource") ||
    joined.includes("estimated_duration") ||
    joined.includes("difficulty")
  );
}

function statusColumnIndex(headers: string[]) {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex(
    (header) =>
      header === "status" ||
      header === "skill_status" ||
      (header.endsWith("_status") && !header.includes("cgpa"))
  );
}

function skillColumnIndex(headers: string[]) {
  const normalized = headers.map(normalizeHeader);
  const required = normalized.findIndex(
    (header) => header === "required_skill" || header === "skill"
  );
  if (required >= 0) {
    return required;
  }
  return normalized.findIndex((header) => header.includes("skill"));
}

function targetFromTables(tables: GenieTable[]) {
  for (const table of tables) {
    const headers = table.headers.map(normalizeHeader);
    const nameIndex = headers.findIndex(
      (header) => header === "name" || header === "company"
    );
    const roleIndex = headers.findIndex(
      (header) => header === "role" || header === "job_role"
    );
    const row = table.rows.at(0);
    if (nameIndex < 0 || roleIndex < 0 || !row) {
      continue;
    }
    const company = row.at(nameIndex)?.trim();
    const role = row.at(roleIndex)?.trim();
    if (company && role) {
      return { company, role };
    }
  }
  return {};
}

function cleanProse(text: string) {
  return text
    .replaceAll(CITATION, "")
    .replaceAll(FOLLOW_UP_CHUNK, "\n")
    .replaceAll(/\[\[[^\]]*\]\]/g, "")
    .replaceAll(/\\[[\]]/g, "")
    .replaceAll(/\]\]/g, "")
    .replaceAll(/\[\[/g, "")
    .replaceAll(/https?:\/\/\S+/g, "")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseGenieAnswer(
  answer: string,
  fallbackScore: number
): ParsedGenieAnswer {
  const lines = answer.replaceAll("\r\n", "\n").split("\n");
  const tables: GenieTable[] = [];
  const proseLines: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (
      line &&
      TABLE_ROW.test(line) &&
      index + 1 < lines.length &&
      isSeparator(lines[index + 1] ?? "")
    ) {
      const headers = splitCells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && TABLE_ROW.test(lines[index] ?? "")) {
        const cells = splitCells(lines[index] ?? "");
        if (cells.some((cell) => cell.length > 0)) {
          rows.push(cells);
        }
        index += 1;
      }
      if (headers.length > 0 && rows.length > 0) {
        tables.push({ headers, rows });
      }
      continue;
    }
    if (line) {
      proseLines.push(line);
    }
    index += 1;
  }

  const missingSkills: string[] = [];
  for (const table of tables) {
    const statusIndex = statusColumnIndex(table.headers);
    const skillIndex = skillColumnIndex(table.headers);
    if (statusIndex < 0 || skillIndex < 0) {
      continue;
    }
    for (const row of table.rows) {
      const status = row.at(statusIndex)?.toUpperCase() ?? "";
      const skill = row.at(skillIndex)?.trim();
      if (status.includes("MISSING") && skill) {
        missingSkills.push(skill);
      }
    }
  }

  const uniqueMissing = [...new Set(missingSkills)];
  let score = fallbackScore;
  for (const table of tables) {
    const percentIndex = table.headers.findIndex((header) =>
      normalizeHeader(header).includes("skill_match")
    );
    const percentCell =
      percentIndex >= 0 ? table.rows.at(0)?.at(percentIndex) : undefined;
    const fromTable = percentCell ? Number(percentCell) : Number.NaN;
    if (!Number.isNaN(fromTable)) {
      score = Math.max(0, Math.min(100, Math.round(fromTable)));
    }
  }
  const percentFromText = answer.match(MATCH_PERCENT);
  if (percentFromText) {
    const value = Number(percentFromText[1]);
    if (!Number.isNaN(value)) {
      score = Math.max(0, Math.min(100, Math.round(value)));
    }
  }

  const displayTables = tables.filter((table) => !isLearningTable(table));
  const { company, role } = targetFromTables(tables);

  return {
    company,
    missingSkills: uniqueMissing,
    prose: cleanProse(proseLines.join("\n")),
    role,
    score,
    tables: displayTables,
  };
}
