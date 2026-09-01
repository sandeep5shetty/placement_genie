"use client";

import {
  GraduationCapIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersRoundIcon,
} from "lucide-react";
import { hasFunnelData } from "@/lib/placement-cell/parse-analytics";
import type { QueryResult } from "@/lib/placement-cell/types";
import {
  formatPercentage,
  isPercentageColumn,
  numericColumns,
  prettyLabel,
  toNumber,
} from "./analytics-utils";

function FunnelKpis({ result }: { result: QueryResult }) {
  const totalApplicants = result.rows.reduce(
    (sum, row) => sum + toNumber(row.applicants),
    0
  );
  const totalShortlisted = result.rows.reduce(
    (sum, row) => sum + toNumber(row.shortlisted),
    0
  );
  const totalSelected = result.rows.reduce(
    (sum, row) => sum + toNumber(row.selected),
    0
  );

  const selectionRate =
    totalApplicants > 0 ? (totalSelected / totalApplicants) * 100 : 0;
  const shortlistRate =
    totalApplicants > 0 ? (totalShortlisted / totalApplicants) * 100 : 0;
  const shortlistToSelectionRate =
    totalShortlisted > 0 ? (totalSelected / totalShortlisted) * 100 : 0;

  const metrics = [
    {
      highlight: false,
      icon: UsersRoundIcon,
      label: "Total Applicants",
      subtext: "Across returned drives",
      value: totalApplicants.toLocaleString(),
    },
    {
      highlight: false,
      icon: TargetIcon,
      label: "Total Shortlisted",
      subtext: `${formatPercentage(shortlistRate)} of applicants`,
      value: totalShortlisted.toLocaleString(),
    },
    {
      highlight: false,
      icon: GraduationCapIcon,
      label: "Total Selected",
      subtext: `${formatPercentage(shortlistToSelectionRate)} of shortlisted`,
      value: totalSelected.toLocaleString(),
    },
    {
      highlight: true,
      icon: TrendingUpIcon,
      label: "Overall Selection Rate",
      subtext: "Selected from applicants",
      value: formatPercentage(selectionRate),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ highlight, icon: Icon, label, subtext, value }) => (
        <div
          className="rounded-xl border border-border/50 bg-card/50 p-4 shadow-[var(--shadow-card)]"
          key={label}
        >
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Icon className="size-4" />
            <span className="text-[11px] font-medium uppercase tracking-wide">
              {label}
            </span>
          </div>
          <p
            className={
              highlight
                ? "font-semibold text-2xl text-primary"
                : "font-semibold text-2xl"
            }
          >
            {value}
          </p>
          {subtext ? (
            <p className="mt-1 text-[12px] text-muted-foreground">{subtext}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function KpiCards({ result }: { result: QueryResult }) {
  if (!result.rows.length) {
    return null;
  }

  if (hasFunnelData(result)) {
    return <FunnelKpis result={result} />;
  }

  const numeric = numericColumns(result);
  if (!numeric.length) {
    return null;
  }

  const metrics = (
    numeric.filter(
      (column) =>
        !column.toLowerCase().includes("pct") &&
        !column.toLowerCase().includes("percentage") &&
        !column.toLowerCase().includes("rate")
    ).length > 0
      ? numeric.filter(
          (column) =>
            !column.toLowerCase().includes("pct") &&
            !column.toLowerCase().includes("percentage") &&
            !column.toLowerCase().includes("rate")
        )
      : numeric
  ).slice(0, 4);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((column) => {
        const values = result.rows
          .map((row) => toNumber(row[column]))
          .filter(Number.isFinite);
        const total = values.reduce((sum, value) => sum + value, 0);
        const displayValue = isPercentageColumn(column)
          ? formatPercentage(
              values.length
                ? values.reduce((sum, value) => sum + value, 0) / values.length
                : 0
            )
          : total.toLocaleString();

        return (
          <div
            className="rounded-xl border border-border/50 bg-card/50 p-4 shadow-[var(--shadow-card)]"
            key={column}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {prettyLabel(column)}
            </p>
            <p className="mt-2 font-semibold text-2xl">{displayValue}</p>
          </div>
        );
      })}
    </div>
  );
}
