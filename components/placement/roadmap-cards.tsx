"use client";

import { CheckIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoadmapData, RoadmapItem } from "@/lib/placement/types";
import { cn } from "@/lib/utils";

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const [complete, setComplete] = useState(false);
  const handleToggle = useCallback(() => {
    setComplete((current) => !current);
  }, []);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/30 p-3 shadow-[var(--shadow-card)]">
      <Button
        aria-pressed={complete}
        className={cn(
          "mt-0.5 size-7 shrink-0 rounded-lg",
          complete && "bg-primary text-primary-foreground hover:bg-primary/80"
        )}
        onClick={handleToggle}
        size="icon-sm"
        type="button"
        variant={complete ? "default" : "outline"}
      >
        <CheckIcon className="size-3.5" />
        <span className="sr-only">
          {complete ? "Mark incomplete" : "Mark complete"}
        </span>
      </Button>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">{item.skill}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          {item.resource}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">
          {item.estimated_duration}
        </p>
      </div>
    </div>
  );
}

export function RoadmapCards({ items }: RoadmapData) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <p className="text-[12px] font-medium text-muted-foreground">
        Suggested roadmap
      </p>
      {items.map((item) => (
        <RoadmapCard item={item} key={`${item.skill}-${item.resource}`} />
      ))}
    </div>
  );
}
