"use client";

import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { QueryResult } from "@/lib/placement-cell/types";
import { formatValue, prettyLabel } from "./analytics-utils";

function studentLabel(row: Record<string, unknown>) {
  return String(
    row.name ?? row.student_name ?? row.student_id ?? row.usn ?? "Student"
  );
}

function StudentDirectoryRow({
  columns,
  id,
  isOpen,
  onToggle,
  row,
}: {
  columns: string[];
  id: string;
  isOpen: boolean;
  onToggle: (id: string, open: boolean) => void;
  row: Record<string, unknown>;
}) {
  const { skills } = row;
  const cgpa = row.cgpa ?? row.CGPA;
  const branch = row.branch ?? row.department;

  const handleToggle = useCallback(() => {
    onToggle(id, isOpen);
  }, [id, isOpen, onToggle]);

  return (
    <div>
      <button
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/20"
        onClick={handleToggle}
        type="button"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{studentLabel(row)}</p>
          <p className="truncate text-[12px] text-muted-foreground">
            {[row.student_id ?? row.usn, branch, cgpa ? `CGPA ${cgpa}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <ChevronDownIcon
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div className="grid gap-2 border-t border-border/30 bg-muted/10 px-4 py-3 sm:grid-cols-2">
          {columns.map((column) => (
            <div key={`${id}-${column}`}>
              <p className="text-[11px] text-muted-foreground">
                {prettyLabel(column)}
              </p>
              <p className="text-[13px]">{formatValue(row[column], column)}</p>
            </div>
          ))}
          {skills ? (
            <div className="sm:col-span-2">
              <p className="text-[11px] text-muted-foreground">Skills</p>
              <p className="text-[13px]">{String(skills)}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function StudentDirectory({ result }: { result: QueryResult }) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleQueryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
    },
    []
  );

  const toggleExpanded = useCallback((id: string, isOpen: boolean) => {
    setExpandedId(isOpen ? null : id);
  }, []);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return result.rows;
    }

    return result.rows.filter((row) =>
      result.columns.some((column) =>
        String(row[column] ?? "")
          .toLowerCase()
          .includes(needle)
      )
    );
  }, [query, result.columns, result.rows]);

  if (!result.rows.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
        <div>
          <p className="font-medium text-sm">Student directory</p>
          <p className="text-[12px] text-muted-foreground">
            Search and expand student readiness details
          </p>
        </div>
        <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-lg border border-border/50 bg-background py-2 pr-3 pl-8 text-[13px]"
            onChange={handleQueryChange}
            placeholder="Search students..."
            value={query}
          />
        </label>
      </div>

      <div className="divide-y divide-border/40">
        {filteredRows.slice(0, 40).map((row, index) => {
          const id = String(
            row.student_id ?? row.usn ?? row.name ?? `student-${index}`
          );

          return (
            <StudentDirectoryRow
              columns={result.columns}
              id={id}
              isOpen={expandedId === id}
              key={id}
              onToggle={toggleExpanded}
              row={row}
            />
          );
        })}
      </div>
    </div>
  );
}
