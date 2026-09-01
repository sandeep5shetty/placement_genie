"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { QueryResult } from "@/lib/placement-cell/types";
import { getFunnelChartData } from "./analytics-utils";

export function FunnelChart({ result }: { result: QueryResult }) {
  const chartData = getFunnelChartData(result);

  if (!chartData.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-4 shadow-[var(--shadow-card)]">
      <div className="mb-4">
        <h3 className="font-medium text-sm">Recruitment funnel comparison</h3>
        <p className="text-[12px] text-muted-foreground">
          Applicants → Shortlisted → Selected
        </p>
      </div>
      <div className="h-[360px] w-full">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={chartData}
            margin={{ bottom: 55, left: 0, right: 20, top: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              angle={-18}
              dataKey="name"
              height={70}
              interval={0}
              textAnchor="end"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="applicants"
              fill="#f97316"
              name="Applicants"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="shortlisted"
              fill="#fb923c"
              name="Shortlisted"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="selected"
              fill="#16a34a"
              name="Selected"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
