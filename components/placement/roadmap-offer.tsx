"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { roadmapLabel, roadmapPath } from "@/lib/placement/roadmap-label";
import type { RoadmapData } from "@/lib/placement/types";
import { roadmapKey } from "@/lib/placement/types";
import { usePlacement } from "./placement-provider";

export function RoadmapOffer({ company, items, plan, role }: RoadmapData) {
  const { roadmaps, upsertRoadmap } = usePlacement();
  const router = useRouter();
  const resolvedPlan =
    plan ??
    ({
      active_sequence: (items ?? []).map((item, order) => ({
        course: item.resource,
        difficulty_order: null,
        duration: item.estimated_duration,
        note: "",
        order: order + 1,
        skill: item.skill,
        status: "not_started" as const,
      })),
      completed: [],
      student_id: "profile",
      summary: "Suggested resources for missing skills.",
    } satisfies NonNullable<RoadmapData["plan"]>);

  const id = roadmapKey(company, role);
  const attached = roadmaps.some((roadmap) => roadmap.id === id);
  const title = roadmapLabel({ company, role });
  const stepCount =
    resolvedPlan.active_sequence.length + resolvedPlan.completed.length;

  const handleAdd = useCallback(() => {
    upsertRoadmap({
      company,
      items: items ?? [],
      plan: resolvedPlan,
      role,
    });
    toast.success("Roadmap added. Track it from Roadmap progress.");
    router.push(roadmapPath(id));
  }, [company, id, items, resolvedPlan, role, router, upsertRoadmap]);

  if (stepCount === 0) {
    return null;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2 rounded-xl border border-border/50 bg-card/30 p-3 shadow-[var(--shadow-card)]">
      <p className="text-[12px] font-medium text-muted-foreground">
        Roadmap agent
      </p>
      <p className="text-[13px] font-medium text-foreground">{title}</p>
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        {resolvedPlan.summary}
      </p>
      {attached ? (
        <Button
          asChild
          className="mt-1 h-8 w-fit rounded-lg text-[12px]"
          size="sm"
          variant="outline"
        >
          <Link href={roadmapPath(id)}>View progress</Link>
        </Button>
      ) : (
        <Button
          className="mt-1 h-8 w-fit rounded-lg text-[12px]"
          onClick={handleAdd}
          size="sm"
          type="button"
          variant="outline"
        >
          Add roadmap
        </Button>
      )}
    </div>
  );
}
