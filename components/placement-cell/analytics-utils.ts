import type { QueryResult } from "@/lib/placement-cell/types";

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#f97316",
  "#16a34a",
];

export function isNumeric(value: unknown): boolean {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "string") {
    const cleaned = value.trim();
    if (!cleaned) {
      return false;
    }
    return !Number.isNaN(Number(cleaned)) && Number.isFinite(Number(cleaned));
  }

  return false;
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function numericColumns(result: QueryResult) {
  return result.columns.filter((column) =>
    result.rows.some((row) => isNumeric(row[column]))
  );
}

export function categoricalColumns(result: QueryResult, numeric: string[]) {
  return result.columns.filter((column) => {
    if (numeric.includes(column)) {
      return false;
    }

    const values = result.rows
      .map((row) => row[column])
      .filter(
        (value) =>
          value !== null && value !== undefined && String(value).trim() !== ""
      );

    return values.length > 0;
  });
}

export function prettyLabel(value: string) {
  return value
    .replace(/_pct$/i, "")
    .replace(/_percentage$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isPercentageColumn(column: string) {
  const lower = column.toLowerCase();
  return (
    lower.includes("pct") ||
    lower.includes("percent") ||
    lower.includes("rate") ||
    lower.includes("conversion")
  );
}

export function formatValue(value: unknown, column?: string) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (isNumeric(value)) {
    const number = toNumber(value);

    if (isPercentageColumn(column ?? "")) {
      return `${number.toFixed(2)}%`;
    }

    if (Math.abs(number) < 0.000_001) {
      return "0";
    }
    if (Number.isInteger(number)) {
      return number.toLocaleString();
    }
    return number.toFixed(2);
  }

  return String(value);
}

export function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toFixed(1)}%`;
}

export function getFunnelChartData(result: QueryResult) {
  const grouped = new Map<
    string,
    {
      name: string;
      applicants: number;
      shortlisted: number;
      selected: number;
    }
  >();

  result.rows.forEach((row, index) => {
    const company = String(row.company_name ?? row.name ?? "").trim();
    const role = String(row.role ?? "").trim();
    const drive = String(row.drive_id ?? "").trim();
    const label =
      company && role
        ? `${company} — ${role}`
        : company || role || drive || `Drive ${index + 1}`;

    const existing = grouped.get(label) ?? {
      applicants: 0,
      name: label,
      selected: 0,
      shortlisted: 0,
    };

    existing.applicants += toNumber(row.applicants);
    existing.shortlisted += toNumber(row.shortlisted);
    existing.selected += toNumber(row.selected);
    grouped.set(label, existing);
  });

  return Array.from(grouped.values())
    .sort((left, right) => right.applicants - left.applicants)
    .slice(0, 12);
}
