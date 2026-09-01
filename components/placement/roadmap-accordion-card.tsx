"use client";

import { ChevronDownIcon, TrashIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { roadmapLabel, roadmapProgress } from "@/lib/placement/roadmap-label";
import {
  currentRoadmapStep,
  listRoadmapSteps,
} from "@/lib/placement/roadmap-steps";
import type {
  SkillProgressStatus,
  TrackedRoadmap,
} from "@/lib/placement/types";
import { cn } from "@/lib/utils";
import { usePlacement } from "./placement-provider";

function statusLabel(status: SkillProgressStatus) {
  return status.replaceAll("_", " ");
}

function StepActions({
  onStatus,
  skill,
  status,
}: {
  onStatus: (skill: string, status: SkillProgressStatus) => void;
  skill: string;
  status: SkillProgressStatus;
}) {
  const start = useCallback(() => {
    onStatus(skill, "in_progress");
  }, [onStatus, skill]);
  const complete = useCallback(() => {
    onStatus(skill, "completed");
  }, [onStatus, skill]);
  const reopen = useCallback(() => {
    onStatus(skill, "in_progress");
  }, [onStatus, skill]);
  const reset = useCallback(() => {
    onStatus(skill, "not_started");
  }, [onStatus, skill]);

  if (status === "not_started") {
    return (
      <Button
        className="h-8 rounded-lg text-[12px]"
        onClick={start}
        size="sm"
        type="button"
        variant="outline"
      >
        Start this step
      </Button>
    );
  }

  if (status === "in_progress") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          className="h-8 rounded-lg text-[12px]"
          onClick={complete}
          size="sm"
          type="button"
          variant="outline"
        >
          Mark complete
        </Button>
        <Button
          className="h-8 rounded-lg text-[12px]"
          onClick={reset}
          size="sm"
          type="button"
          variant="ghost"
        >
          Reset
        </Button>
      </div>
    );
  }

  return (
    <Button
      className="h-8 rounded-lg text-[12px]"
      onClick={reopen}
      size="sm"
      type="button"
      variant="ghost"
    >
      Move back to in progress
    </Button>
  );
}

function DeleteRoadmapButton({
  label,
  onDelete,
}: {
  label: string;
  onDelete: () => void;
}) {
  const handleDelete = useCallback(() => {
    onDelete();
    toast.success("Roadmap removed.");
  }, [onDelete]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <TrashIcon className="size-3.5" />
          <span className="sr-only">Delete {label}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this roadmap?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} will be removed from tracking. You can add it again from a
            Genie answer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RoadmapGuide({
  onStatus,
  roadmap,
}: {
  onStatus: (skill: string, status: SkillProgressStatus) => void;
  roadmap: TrackedRoadmap;
}) {
  const steps = listRoadmapSteps(roadmap);
  const current = currentRoadmapStep(steps);

  return (
    <div className="flex flex-col gap-4 border-t border-border/40 px-4 pb-4 pt-3">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {roadmap.plan.summary}
      </p>
      <p className="text-[12px] text-muted-foreground">
        {current
          ? `Work on now: ${current.skill}. Follow the guide under that step.`
          : "Every listed step is complete."}
      </p>
      <ol className="flex flex-col gap-3">
        {steps.map((step) => {
          const isCurrent = current?.skill === step.skill;
          return (
            <li
              className={
                isCurrent
                  ? "rounded-xl border border-foreground/20 bg-background/60 p-4"
                  : "rounded-xl border border-border/40 bg-background/40 p-4"
              }
              key={step.skill}
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Step {step.order}
                  </span>
                  <p className="text-[14px] font-medium">{step.skill}</p>
                  <Badge variant="outline">{statusLabel(step.status)}</Badge>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    What to do
                  </p>
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {step.guide.map((line) => (
                      <li
                        className="text-[13px] leading-relaxed text-muted-foreground"
                        key={line}
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                <StepActions
                  onStatus={onStatus}
                  skill={step.skill}
                  status={step.status}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function RoadmapAccordionCard({
  defaultOpen,
  roadmap,
}: {
  defaultOpen: boolean;
  roadmap: TrackedRoadmap;
}) {
  const { removeRoadmap, setRoadmapSkillStatus } = usePlacement();
  const [open, setOpen] = useState(defaultOpen);
  const { done, total } = roadmapProgress(roadmap);
  const width = total === 0 ? "0%" : `${Math.round((done / total) * 100)}%`;
  const label = roadmapLabel(roadmap);

  const handleStatus = useCallback(
    (skill: string, status: SkillProgressStatus) => {
      setRoadmapSkillStatus(roadmap.id, skill, status);
    },
    [roadmap.id, setRoadmapSkillStatus]
  );

  const handleDelete = useCallback(() => {
    removeRoadmap(roadmap.id);
  }, [removeRoadmap, roadmap.id]);

  return (
    <Collapsible
      className="rounded-xl border border-border/50 bg-card/30 shadow-[var(--shadow-card)]"
      onOpenChange={setOpen}
      open={open}
    >
      <div className="flex items-start gap-1 p-2 pr-2">
        <CollapsibleTrigger asChild>
          <button
            className="flex min-w-0 flex-1 flex-col gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/40"
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-[14px] font-medium">{label}</p>
              <span className="shrink-0 text-[12px] text-muted-foreground">
                {done}/{total}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[12px] text-muted-foreground">
                {roadmap.plan.summary}
              </p>
              <ChevronDownIcon
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>
        <DeleteRoadmapButton label={label} onDelete={handleDelete} />
      </div>
      <CollapsibleContent>
        <RoadmapGuide onStatus={handleStatus} roadmap={roadmap} />
      </CollapsibleContent>
    </Collapsible>
  );
}
