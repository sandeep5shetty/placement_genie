"use client";

import { Table2Icon } from "lucide-react";
import type { QueryResult } from "@/lib/placement-cell/types";
import { formatValue, prettyLabel } from "./analytics-utils";

export function InsightTable({ result }: { result: QueryResult }) {
  if (!result.rows.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-6 text-[13px] text-muted-foreground">
        No query rows were returned for this analysis.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Table2Icon className="size-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">
              {result.title || "Query results"}
            </p>
            <p className="text-[12px] text-muted-foreground">
              Data returned from Placement Cell Genie
            </p>
          </div>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
          {result.rowCount ?? result.rows.length} rows
        </span>
      </div>

      {result.description ? (
        <p className="px-4 py-3 text-[13px] text-muted-foreground">
          {result.description}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-[12px]">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              {result.columns.map((column) => (
                <th
                  className="px-3 py-2 font-medium text-muted-foreground"
                  key={column}
                  scope="col"
                >
                  {prettyLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.slice(0, 50).map((row) => {
              const rowKey = result.columns
                .map((column) => String(row[column] ?? ""))
                .join("|");

              return (
                <tr
                  className="border-b border-border/30 last:border-0"
                  key={rowKey}
                >
                  {result.columns.map((column) => (
                    <td
                      className="px-3 py-2 text-foreground"
                      key={`${rowKey}-${column}`}
                    >
                      {formatValue(row[column], column)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {result.isTruncated ? (
        <p className="px-4 py-3 text-[12px] text-muted-foreground">
          Results are truncated. Showing available rows returned by Genie.
        </p>
      ) : null}
    </div>
  );
}
