import type { QueryResult } from "./types";

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const SEPARATOR = /^\s*\|?\s*:?-{3,}/;

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

function rowFromCells(headers: string[], cells: string[]) {
  return Object.fromEntries(
    headers.map((header, index) => [header, cells.at(index) ?? ""])
  );
}

function parseMarkdownTables(answer: string): QueryResult[] {
  const lines = answer.replaceAll("\r\n", "\n").split("\n");
  const tables: QueryResult[] = [];
  let index = 0;
  let tableIndex = 0;

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
      const rows: Record<string, unknown>[] = [];

      while (index < lines.length && TABLE_ROW.test(lines[index] ?? "")) {
        const cells = splitCells(lines[index] ?? "");
        if (cells.some((cell) => cell.length > 0)) {
          rows.push(rowFromCells(headers, cells));
        }
        index += 1;
      }

      if (headers.length > 0 && rows.length > 0) {
        tableIndex += 1;
        tables.push({
          columns: headers,
          id: `table-${tableIndex}`,
          rowCount: rows.length,
          rows,
        });
      }
      continue;
    }

    index += 1;
  }

  return tables;
}

function parseJsonTable(value: unknown, index: number): QueryResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }

    const [first] = value;
    if (!first || typeof first !== "object" || Array.isArray(first)) {
      return null;
    }

    const columns = Object.keys(first as Record<string, unknown>);
    return {
      columns,
      id: `json-${index}`,
      rowCount: value.length,
      rows: value as Record<string, unknown>[],
    };
  }

  const record = value as Record<string, unknown>;
  const { columns, description, rows, title } = record;

  if (Array.isArray(rows) && Array.isArray(columns)) {
    const columnNames = columns.map((column) => String(column));
    return {
      columns: columnNames,
      description: typeof description === "string" ? description : undefined,
      id: `json-${index}`,
      rowCount: rows.length,
      rows: rows.map((row) => {
        if (Array.isArray(row)) {
          return Object.fromEntries(
            columnNames.map((column, columnIndex) => [
              column,
              row.at(columnIndex) ?? "",
            ])
          );
        }
        if (row && typeof row === "object") {
          return row as Record<string, unknown>;
        }
        return {};
      }),
      title: typeof title === "string" ? title : undefined,
    };
  }

  return null;
}

function extractJsonBlocks(text: string): QueryResult[] {
  const results: QueryResult[] = [];
  const fenced = text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);

  for (const match of fenced) {
    const body = match[1]?.trim();
    if (!body) {
      continue;
    }

    try {
      const parsed = JSON.parse(body) as unknown;
      const table = parseJsonTable(parsed, results.length + 1);
      if (table) {
        results.push(table);
      }
    } catch {
      // ignore invalid JSON blocks
    }
  }

  return results;
}

export function extractSuggestedQuestions(answer: string) {
  const lines = answer.split("\n");
  const questions: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(?:[-*•]|\d+\.)\s+/.test(trimmed) && trimmed.endsWith("?")) {
      questions.push(trimmed.replace(/^(?:[-*•]|\d+\.)\s+/, ""));
    }
  }

  return [...new Set(questions)].slice(0, 4);
}

export function parseAnalyticsAnswer(answer: string): {
  prose: string;
  queryResults: QueryResult[];
  suggestedQuestions: string[];
} {
  const jsonTables = extractJsonBlocks(answer);
  const markdownTables = parseMarkdownTables(answer);
  const queryResults = jsonTables.length > 0 ? jsonTables : markdownTables;

  const prose = answer
    .replace(/```(?:json)?\s*[\s\S]*?```/gi, "")
    .replace(/^\s*\|.*\|\s*$/gm, "")
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    prose,
    queryResults,
    suggestedQuestions: extractSuggestedQuestions(answer),
  };
}

export function hasFunnelData(result: QueryResult) {
  const columns = result.columns.map((column) => column.toLowerCase());
  return (
    columns.includes("applicants") &&
    columns.includes("shortlisted") &&
    columns.includes("selected")
  );
}

export function isStudentDirectory(result: QueryResult) {
  const columns = result.columns.map((column) => column.toLowerCase());
  return (
    columns.some((column) => column.includes("student")) &&
    (columns.includes("cgpa") ||
      columns.includes("name") ||
      columns.includes("branch"))
  );
}
