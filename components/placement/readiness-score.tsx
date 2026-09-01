"use client";

import { Badge } from "@/components/ui/badge";
import type { ReadinessData } from "@/lib/placement/types";

export function ReadinessScore({ score, company, role }: ReadinessData) {
  const label = [company, role].filter(Boolean).join(" · ");
  const width = `${Math.max(4, Math.min(100, score))}%`;

  return (
    <div className="flex w-full max-w-md flex-col gap-2 rounded-xl border border-border/50 bg-card/30 p-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-muted-foreground">
          Readiness score
        </span>
        <Badge variant="outline">{score}/100</Badge>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground" style={{ width }} />
      </div>
      {label ? (
        <p className="text-[12px] text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
