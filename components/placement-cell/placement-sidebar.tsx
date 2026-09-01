"use client";

import {
  BotIcon,
  ChevronRightIcon,
  LogOutIcon,
  MenuIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useCallback } from "react";
import { GenieMark } from "@/components/placement/genie-mark";
import { placementCellNavItems } from "@/lib/placement-cell/prompts";
import { cn } from "@/lib/utils";

type PlacementSidebarProps = {
  activeSection: string;
  loading: boolean;
  onNewAnalysis: () => void;
  onSelectSection: (label: string, question: string) => void;
  onToggleMobile: () => void;
  open: boolean;
};

type SidebarNavButtonProps = {
  active: boolean;
  disabled: boolean;
  label: string;
  onSelect: (label: string, question: string) => void;
  question: string;
};

function SidebarNavButton({
  active,
  disabled,
  label,
  onSelect,
  question,
}: SidebarNavButtonProps) {
  const handleClick = useCallback(() => {
    onSelect(label, question);
  }, [label, onSelect, question]);

  return (
    <button
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors",
        active
          ? "bg-muted/60 font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
      )}
      disabled={disabled}
      onClick={handleClick}
      type="button"
    >
      <span className="flex-1">{label}</span>
      <ChevronRightIcon className="size-4 opacity-60" />
    </button>
  );
}

export function PlacementSidebar({
  activeSection,
  loading,
  onNewAnalysis,
  onSelectSection,
  onToggleMobile,
  open,
}: PlacementSidebarProps) {
  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/placement-cell/login" });
  }, []);

  return (
    <>
      <button
        aria-label="Open navigation"
        className="fixed top-4 left-4 z-40 inline-flex size-10 items-center justify-center rounded-lg border border-border/50 bg-background md:hidden"
        onClick={onToggleMobile}
        type="button"
      >
        <MenuIcon className="size-5" />
      </button>

      {open ? (
        <button
          aria-label="Close navigation backdrop"
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={onToggleMobile}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-border/50 bg-sidebar p-4 transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-5 flex items-center gap-3 border-b border-border/40 pb-4">
          <GenieMark size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">Placement Cell</p>
            <p className="truncate text-[11px] text-muted-foreground">
              Campus intelligence
            </p>
          </div>
          <button
            aria-label="Close navigation"
            className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-muted-foreground md:hidden"
            onClick={onToggleMobile}
            type="button"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <button
          className="mb-4 inline-flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 text-[13px] font-medium transition-colors hover:bg-muted/40"
          disabled={loading}
          onClick={onNewAnalysis}
          type="button"
        >
          <PlusIcon className="size-4" />
          New analysis
        </button>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {placementCellNavItems.map(({ label, question }) => (
            <SidebarNavButton
              active={activeSection === label}
              disabled={loading}
              key={label}
              label={label}
              onSelect={onSelectSection}
              question={question}
            />
          ))}
        </nav>

        <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2 text-[11px] text-muted-foreground">
            <BotIcon className="size-4" />
            Powered by Databricks Genie
          </div>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
            onClick={handleSignOut}
            type="button"
          >
            <LogOutIcon className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
