"use client";

import { UserRoundIcon } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { usePlacement } from "./placement-provider";

export function ProfileHeaderButton() {
  const { name, cgpa, setProfileOpen, skills, usn } = usePlacement();
  const handleOpen = useCallback(() => {
    setProfileOpen(true);
  }, [setProfileOpen]);

  const summary = name.trim() || "Profile";
  const meta = [
    usn ? usn : null,
    cgpa ? `CGPA ${cgpa}` : null,
    skills.length > 0 ? `${skills.length} skills` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const label = [summary, meta].filter(Boolean).join(" · ");

  return (
    <Button
      className="ml-auto max-w-[220px] gap-2 rounded-lg border-border/50 text-muted-foreground shadow-none hover:text-foreground"
      onClick={handleOpen}
      size="sm"
      type="button"
      variant="outline"
    >
      <UserRoundIcon className="size-3.5 shrink-0" />
      <span className="truncate text-[12px]">{label}</span>
    </Button>
  );
}
