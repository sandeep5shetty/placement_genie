"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { QueryResult } from "@/lib/placement-cell/types";
import {
  CHART_COLORS,
  categoricalColumns,
  isNumeric,
  numericColumns,
  prettyLabel,
  toNumber,
} from "./analytics-utils";

type ChartType = "bar" | "line" | "pie";

export function GenericChart({ result }: { result: QueryResult }) {
  const numeric = useMemo(() => numericColumns(result), [result]);
  const categorical = useMemo(
    () => categoricalColumns(result, numeric),
    [numeric, result]
  );

  const [chartType, setChartType] = useState<ChartType>("bar");
  const [xAxis, setXAxis] = useState(categorical[0] ?? "");
  const [metric, setMetric] = useState(numeric[0] ?? "");

  useEffect(() => {
    const nextNumeric = numericColumns(result);
    const nextCategorical = categoricalColumns(result, nextNumeric);
    setXAxis(nextCategorical[0] ?? "");
    setMetric(nextNumeric[0] ?? "");
    setChartType("bar");
  }, [result]);

  const handleChartType = useCallback((type: ChartType) => {
    setChartType(type);
  }, []);
  const showBarChart = useCallback(
    () => handleChartType("bar"),
    [handleChartType]
  );
  const showLineChart = useCallback(
    () => handleChartType("line"),
    [handleChartType]
  );
  const showPieChart = useCallback(
    () => handleChartType("pie"),
    [handleChartType]
  );

  const handleXAxisChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setXAxis(event.target.value);
    },
    []
  );

  const handleMetricChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setMetric(event.target.value);
    },
    []
  );

  if (!result.rows.length || !numeric.length || !categorical.length) {
    return null;
  }

  const chartData = result.rows
    .filter(
      (row) =>
        row[xAxis] !== null &&
        row[xAxis] !== undefined &&
        isNumeric(row[metric])
    )
    .slice(0, 20)
    .map((row) => ({
      name: String(row[xAxis]),
      value: toNumber(row[metric]),
    }));

  if (!chartData.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-sm">
            {result.title || "Data visualization"}
          </h3>
          <p className="text-[12px] text-muted-foreground">
            Interactive analysis of Genie query results
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
          <button
            className={`rounded-md px-2.5 py-1 text-[12px] ${
              chartType === "bar"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
            onClick={showBarChart}
            type="button"
          >
            bar
          </button>
          <button
            className={`rounded-md px-2.5 py-1 text-[12px] ${
              chartType === "line"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
            onClick={showLineChart}
            type="button"
          >
            line
          </button>
          {chartData.length <= 10 ? (
            <button
              className={`rounded-md px-2.5 py-1 text-[12px] ${
                chartType === "pie"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
              onClick={showPieChart}
              type="button"
            >
              pie
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          Dimension
          <select
            className="rounded-md border border-border/50 bg-background px-2 py-1.5 text-[12px]"
            onChange={handleXAxisChange}
            value={xAxis}
          >
            {categorical.map((column) => (
              <option key={column} value={column}>
                {prettyLabel(column)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          Metric
          <select
            className="rounded-md border border-border/50 bg-background px-2 py-1.5 text-[12px]"
            onChange={handleMetricChange}
            value={metric}
          >
            {numeric.map((column) => (
              <option key={column} value={column}>
                {prettyLabel(column)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          {chartType === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="value"
                fill="#f97316"
                name={prettyLabel(metric)}
                radius={[7, 7, 0, 0]}
              />
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                dataKey="value"
                dot={{ fill: "#f97316", r: 4 }}
                name={prettyLabel(metric)}
                stroke="#f97316"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={chartData}
                dataKey="value"
                label
                nameKey="name"
                outerRadius={115}
              >
                {chartData.map((entry) => (
                  <Cell
                    fill={
                      CHART_COLORS[
                        chartData.indexOf(entry) % CHART_COLORS.length
                      ]
                    }
                    key={entry.name}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
