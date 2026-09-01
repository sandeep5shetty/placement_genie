"use client";

import { FileTextIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { toast } from "@/components/chat/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { StudentProfile } from "@/lib/placement/types";
import { usePlacement } from "./placement-provider";

function emailToHue(value: string) {
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

function ProfileInput({
  className,
  id,
  inputMode,
  onValueChange,
  placeholder,
  type,
  value,
}: {
  className?: string;
  id: string;
  inputMode?: "decimal";
  onValueChange: (value: string) => void;
  placeholder: string;
  type?: "email" | "text";
  value: string;
}) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onValueChange(event.target.value);
    },
    [onValueChange]
  );

  return (
    <Input
      className={className}
      id={id}
      inputMode={inputMode}
      onChange={handleChange}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}

function SkillChip({
  onRemove,
  skill,
}: {
  onRemove: (skill: string) => void;
  skill: string;
}) {
  const handleClick = useCallback(() => {
    onRemove(skill);
  }, [onRemove, skill]);

  return (
    <Badge className="h-6 gap-1 pr-1" variant="secondary">
      {skill}
      <button
        aria-label={`Remove ${skill}`}
        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        onClick={handleClick}
        type="button"
      >
        <XIcon className="size-3" />
      </button>
    </Badge>
  );
}

export function ProfileSheet() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftSkill, setDraftSkill] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const {
    applyProfile,
    cgpa,
    college,
    degree,
    email,
    name,
    profileOpen,
    resumeName,
    setCgpa,
    setCollege,
    setDegree,
    setEmail,
    setName,
    setProfileOpen,
    setResumeName,
    setSkills,
    setTargetRole,
    setUsn,
    skills,
    targetRole,
    usn,
  } = usePlacement();

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.item(0);
      event.target.value = "";
      if (!file) {
        return;
      }

      setIsExtracting(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/extract-skills`,
          {
            body: formData,
            method: "POST",
          }
        );
        const payload = (await response.json()) as StudentProfile & {
          error?: string;
        };

        if (!response.ok) {
          toast({
            description: payload.error ?? "Could not read that resume.",
            type: "error",
          });
          return;
        }

        applyProfile(payload);
        setResumeName(file.name);
        toast({
          description:
            [
              payload.usn ? `USN ${payload.usn}` : null,
              payload.cgpa ? `CGPA ${payload.cgpa}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Profile updated from your resume.",
          type: "success",
        });
      } catch {
        toast({
          description: "Failed to read that resume. Try PDF or DOCX.",
          type: "error",
        });
      } finally {
        setIsExtracting(false);
      }
    },
    [applyProfile, setResumeName]
  );

  const handleRemoveSkill = useCallback(
    (skill: string) => {
      setSkills((current) => current.filter((item) => item !== skill));
    },
    [setSkills]
  );

  const handleAddSkill = useCallback(() => {
    const next = draftSkill.trim();
    if (!next) {
      return;
    }
    setSkills((current) =>
      current.some((item) => item.toLowerCase() === next.toLowerCase())
        ? current
        : [...current, next]
    );
    setDraftSkill("");
  }, [draftSkill, setSkills]);

  const handleDraftSkillChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDraftSkill(event.target.value);
    },
    []
  );

  const handleSkillKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAddSkill();
      }
    },
    [handleAddSkill]
  );

  const displayName = name.trim() || "Your profile";
  const hue = emailToHue(name || email || "profile");

  return (
    <Sheet onOpenChange={setProfileOpen} open={profileOpen}>
      <SheetContent
        className="w-full overflow-y-auto data-[side=right]:sm:max-w-lg"
        side="right"
      >
        <SheetHeader className="border-b border-border/40">
          <SheetTitle>Placement profile</SheetTitle>
          <SheetDescription>
            Upload a resume to fill this in, then edit anything that looks off.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-6 pb-8">
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-[13px] font-medium text-primary-foreground ring-1 ring-border/50"
              style={{
                background: `linear-gradient(135deg, oklch(0.35 0.08 ${hue}), oklch(0.25 0.05 ${hue + 40}))`,
              }}
            >
              {initialsFromName(name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium tracking-tight">
                {displayName}
              </p>
              <p className="truncate text-[12px] text-muted-foreground">
                {email || "Add an email after uploading your resume"}
              </p>
            </div>
          </div>

          <input
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
          />
          <button
            className="flex w-full flex-col items-start gap-1 rounded-xl border border-dashed border-border/60 bg-card/30 px-4 py-4 text-left transition-colors hover:border-border hover:bg-card/60"
            disabled={isExtracting}
            onClick={handlePickFile}
            type="button"
          >
            <span className="flex items-center gap-2 text-[13px] font-medium">
              {isExtracting ? (
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <FileTextIcon className="size-4 text-muted-foreground" />
              )}
              {isExtracting ? "Reading resume..." : "Upload resume"}
            </span>
            <span className="text-[12px] text-muted-foreground">
              {resumeName ??
                "PDF or DOCX. We extract USN, name, CGPA, college, and skills."}
            </span>
          </button>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="profile-name">Full name</Label>
              <ProfileInput
                className="rounded-lg"
                id="profile-name"
                onValueChange={setName}
                placeholder="Alex Kumar"
                value={name}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-usn">USN</Label>
              <ProfileInput
                className="rounded-lg"
                id="profile-usn"
                onValueChange={setUsn}
                placeholder="1BM25MC042"
                value={usn}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-cgpa">CGPA</Label>
              <ProfileInput
                className="rounded-lg"
                id="profile-cgpa"
                inputMode="decimal"
                onValueChange={setCgpa}
                placeholder="8.72"
                value={cgpa}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="profile-email">Email</Label>
              <ProfileInput
                className="rounded-lg"
                id="profile-email"
                onValueChange={setEmail}
                placeholder="alex@college.edu"
                type="email"
                value={email}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-role">Target role</Label>
              <ProfileInput
                className="rounded-lg"
                id="profile-role"
                onValueChange={setTargetRole}
                placeholder="SDE intern"
                value={targetRole}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="profile-college">College</Label>
              <ProfileInput
                className="rounded-lg"
                id="profile-college"
                onValueChange={setCollege}
                placeholder="College or university"
                value={college}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="profile-degree">Degree</Label>
              <ProfileInput
                className="rounded-lg"
                id="profile-degree"
                onValueChange={setDegree}
                placeholder="B.Tech Computer Science"
                value={degree}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="profile-skill">Skills</Label>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <SkillChip
                    key={skill}
                    onRemove={handleRemoveSkill}
                    skill={skill}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                No skills yet. Upload a resume or add them below.
              </p>
            )}
            <div className="flex items-center gap-2">
              <Input
                className="rounded-lg"
                id="profile-skill"
                onChange={handleDraftSkillChange}
                onKeyDown={handleSkillKeyDown}
                placeholder="Add a skill"
                value={draftSkill}
              />
              <Button
                onClick={handleAddSkill}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <PlusIcon className="size-3.5" />
                <span className="sr-only">Add skill</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
