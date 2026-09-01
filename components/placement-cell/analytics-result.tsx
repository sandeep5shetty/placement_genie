"use client";

import { BarChart3Icon, Table2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import {
  hasFunnelData,
  isStudentDirectory,
} from "@/lib/placement-cell/parse-analytics";
import type { QueryResult } from "@/lib/placement-cell/types";
import { categoricalColumns, numericColumns } from "./analytics-utils";
import { FunnelChart } from "./funnel-chart";
import { GenericChart } from "./generic-chart";
import { InsightTable } from "./insight-table";
import { KpiCards } from "./kpi-cards";
import { StudentDirectory } from "./student-directory";

export function AnalyticsResult({ result }: { result: QueryResult }) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const numeric = numericColumns(result);
  const categorical = categoricalColumns(result, numeric);
  const chartable =
    result.rows.length >= 2 && numeric.length > 0 && categorical.length > 0;
  const funnel = hasFunnelData(result);
  const directory = isStudentDirectory(result);
  const showChart = useCallback(() => setView("chart"), []);
  const showTable = useCallback(() => setView("table"), []);

  return (
    <section className="flex flex-col gap-4">
      <KpiCards result={result} />

      {directory ? <StudentDirectory result={result} /> : null}

      {chartable ? (
        <div className="flex w-fit gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
          <button
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] ${
              view === "chart"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
            onClick={showChart}
            type="button"
          >
            <BarChart3Icon className="size-3.5" />
            Chart
          </button>
          <button
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] ${
              view === "table"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
            onClick={showTable}
            type="button"
          >
            <Table2Icon className="size-3.5" />
            Table
          </button>
        </div>
      ) : null}

      {view === "chart" && chartable ? (
        funnel ? (
          <FunnelChart result={result} />
        ) : (
          <GenericChart result={result} />
        )
      ) : (
        <InsightTable result={result} />
      )}
    </section>
  );
}
