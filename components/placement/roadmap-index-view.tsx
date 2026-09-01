"use client";

import { MapIcon } from "lucide-react";
import { usePlacement } from "@/components/placement/placement-provider";
import { RoadmapAccordionCard } from "@/components/placement/roadmap-accordion-card";
import { RoadmapPageFrame } from "@/components/placement/roadmap-page-frame";

export function RoadmapIndexView({ initialOpen }: { initialOpen?: string }) {
  const { roadmaps } = usePlacement();

  return (
    <RoadmapPageFrame title="Roadmap progress">
      {roadmaps.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-card/30 p-5 shadow-[var(--shadow-card)]">
          <MapIcon className="size-5 text-muted-foreground" />
          <p className="text-[14px] font-medium">No roadmaps added yet</p>
          <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
            Ask Genie about a company and role, then choose Add roadmap. Open a
            plan here to see progress and the step-by-step guide.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted-foreground">
            Click a roadmap to expand progress and the study guide. Delete
            removes it from tracking.
          </p>
          {roadmaps.map((roadmap) => (
            <RoadmapAccordionCard
              defaultOpen={
                initialOpen
                  ? roadmap.id === initialOpen
                  : roadmap.id === roadmaps.at(0)?.id
              }
              key={roadmap.id}
              roadmap={roadmap}
            />
          ))}
        </div>
      )}
    </RoadmapPageFrame>
  );
}
