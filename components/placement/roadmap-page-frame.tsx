"use client";

import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProfileHeaderButton } from "@/components/placement/profile-header-button";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function RoadmapPageHeader({
  showIndexLink,
  title,
}: {
  showIndexLink?: boolean;
  title: string;
}) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 flex h-14 items-center gap-2 bg-sidebar px-3">
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
        <span className="sr-only">Open sidebar</span>
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">
          {title}
        </p>
        {showIndexLink ? (
          <Link
            className="text-[11px] text-muted-foreground hover:text-foreground"
            href="/roadmap"
          >
            All roadmaps
          </Link>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Added plans from Genie
          </p>
        )}
      </div>
      <ProfileHeaderButton />
    </header>
  );
}

export function RoadmapPageFrame({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="flex h-dvh w-full flex-row overflow-hidden">
      <div className="flex min-w-0 w-full flex-col bg-sidebar">
        <RoadmapPageHeader
          showIndexLink={title !== "Roadmap progress"}
          title={title}
        />
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40">
          <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 md:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
