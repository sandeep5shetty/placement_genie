"use client";

import { cn } from "@/lib/utils";
import { usePlacement } from "./placement-provider";

function hueFromValue(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = char.charCodeAt(0) + (hash * 32 - hash);
  }
  return Math.abs(hash) % 360;
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "PR";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function ProfileMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  const { email, name } = usePlacement();
  const px = `${size}px`;
  const radius = `${Math.round(size * 0.22)}px`;
  const hue = hueFromValue(name || email || "profile");
  const label = name.trim() || "Your profile";

  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden font-medium text-primary-foreground",
        className
      )}
      role="img"
      style={{
        background: `linear-gradient(135deg, oklch(0.35 0.08 ${hue}), oklch(0.25 0.05 ${hue + 40}))`,
        borderRadius: radius,
        fontSize: `${Math.max(10, Math.round(size * 0.36))}px`,
        height: px,
        minHeight: px,
        minWidth: px,
        width: px,
      }}
    >
      {initialsFromName(name)}
    </span>
  );
}
