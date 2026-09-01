"use client";

import { MapIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  roadmapLabel,
  roadmapPath,
  roadmapProgress,
} from "@/lib/placement/roadmap-label";
import type { TrackedRoadmap } from "@/lib/placement/types";
import { usePlacement } from "./placement-provider";

function RoadmapNavItem({ roadmap }: { roadmap: TrackedRoadmap }) {
  const { setOpenMobile } = useSidebar();
  const href = roadmapPath(roadmap.id);
  const { done, total } = roadmapProgress(roadmap);
  const handleClick = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="h-auto items-start rounded-lg py-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        tooltip={roadmapLabel(roadmap)}
      >
        <Link href={href} onClick={handleClick}>
          <MapIcon className="mt-0.5 size-4 shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-medium text-[13px]">
              {roadmapLabel(roadmap)}
            </span>
            <span className="text-[11px] text-sidebar-foreground/50">
              {done}/{total} complete
            </span>
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function SidebarRoadmaps() {
  const { roadmaps } = usePlacement();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const handleIndexClick = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:p-0">
      <SidebarGroupLabel>Roadmaps</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-8 rounded-lg text-[13px] text-sidebar-foreground/70 hover:text-sidebar-foreground"
              isActive={pathname.startsWith("/roadmap")}
              tooltip="Roadmap progress"
            >
              <Link href="/roadmap" onClick={handleIndexClick}>
                <MapIcon className="size-4" />
                <span className="font-medium">Roadmap progress</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {roadmaps.length === 0 ? (
            <SidebarMenuItem>
              <p className="px-2 py-1 text-[12px] leading-relaxed text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                Add a roadmap from chat to track it here.
              </p>
            </SidebarMenuItem>
          ) : (
            roadmaps.map((roadmap) => (
              <RoadmapNavItem key={roadmap.id} roadmap={roadmap} />
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
