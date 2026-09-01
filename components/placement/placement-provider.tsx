"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { applyRoadmapStatus } from "@/lib/placement/roadmap-agent";
import type {
  RoadmapData,
  SkillProgressStatus,
  StudentContext,
  StudentProfile,
  TrackedRoadmap,
} from "@/lib/placement/types";
import { roadmapKey } from "@/lib/placement/types";

type StoredProfile = {
  cgpa: string;
  college: string;
  degree: string;
  email: string;
  name: string;
  resumeName: string | null;
  skills: string[];
  targetRole: string;
  usn: string;
};

type PlacementContextValue = {
  college: string;
  setCollege: Dispatch<SetStateAction<string>>;
  degree: string;
  setDegree: Dispatch<SetStateAction<string>>;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  cgpa: string;
  setCgpa: Dispatch<SetStateAction<string>>;
  usn: string;
  setUsn: Dispatch<SetStateAction<string>>;
  targetRole: string;
  setTargetRole: Dispatch<SetStateAction<string>>;
  skills: string[];
  setSkills: Dispatch<SetStateAction<string[]>>;
  resumeName: string | null;
  setResumeName: Dispatch<SetStateAction<string | null>>;
  profileOpen: boolean;
  setProfileOpen: Dispatch<SetStateAction<boolean>>;
  applyProfile: (profile: StudentProfile) => void;
  roadmaps: TrackedRoadmap[];
  upsertRoadmap: (data: RoadmapData) => void;
  removeRoadmap: (roadmapId: string) => void;
  setRoadmapSkillStatus: (
    roadmapId: string,
    skill: string,
    status: SkillProgressStatus,
    fallback?: RoadmapData
  ) => void;
  studentContext: StudentContext;
};

const PlacementContext = createContext<PlacementContextValue | null>(null);

const emptyProfile: StoredProfile = {
  cgpa: "",
  college: "",
  degree: "",
  email: "",
  name: "",
  resumeName: null,
  skills: [],
  targetRole: "",
  usn: "",
};

function storageKey(userId: string) {
  return `placement-profile:${userId}`;
}

function roadmapsStorageKey(userId: string) {
  return `placement-roadmaps:${userId}`;
}

function isTrackedRoadmap(value: unknown): value is TrackedRoadmap {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<TrackedRoadmap>;
  return (
    typeof record.id === "string" &&
    typeof record.updatedAt === "number" &&
    Boolean(record.plan) &&
    Array.isArray(record.plan?.active_sequence) &&
    Array.isArray(record.plan?.completed)
  );
}

function readStoredRoadmaps(userId: string): TrackedRoadmap[] {
  try {
    const raw = window.localStorage.getItem(roadmapsStorageKey(userId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isTrackedRoadmap).slice(0, 12);
  } catch {
    return [];
  }
}

function readStored(userId: string): StoredProfile {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return emptyProfile;
    }
    const parsed = JSON.parse(raw) as Partial<StoredProfile>;
    return {
      cgpa: parsed.cgpa ?? "",
      college: parsed.college ?? "",
      degree: parsed.degree ?? "",
      email: parsed.email ?? "",
      name: parsed.name ?? "",
      resumeName: parsed.resumeName ?? null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      targetRole: parsed.targetRole ?? "",
      usn: parsed.usn ?? "",
    };
  } catch {
    return emptyProfile;
  }
}

export function PlacementProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [usn, setUsn] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [roadmaps, setRoadmaps] = useState<TrackedRoadmap[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading" || !userId) {
      return;
    }
    const stored = readStored(userId);
    setCgpa(stored.cgpa);
    setCollege(stored.college);
    setDegree(stored.degree);
    setEmail(stored.email);
    setName(stored.name);
    setResumeName(stored.resumeName);
    setSkills(stored.skills);
    setTargetRole(stored.targetRole);
    setUsn(stored.usn);
    setRoadmaps(readStoredRoadmaps(userId));
    setReady(true);
  }, [status, userId]);

  useEffect(() => {
    if (!(ready && userId)) {
      return;
    }
    const payload: StoredProfile = {
      cgpa,
      college,
      degree,
      email,
      name,
      resumeName,
      skills,
      targetRole,
      usn,
    };
    window.localStorage.setItem(storageKey(userId), JSON.stringify(payload));
    window.localStorage.setItem(
      roadmapsStorageKey(userId),
      JSON.stringify(roadmaps)
    );
  }, [
    cgpa,
    college,
    degree,
    email,
    name,
    ready,
    resumeName,
    roadmaps,
    skills,
    targetRole,
    userId,
    usn,
  ]);

  const applyProfile = useCallback((profile: StudentProfile) => {
    if (profile.college) {
      setCollege(profile.college);
    }
    if (profile.degree) {
      setDegree(profile.degree);
    }
    if (profile.email) {
      setEmail(profile.email);
    }
    if (profile.name) {
      setName(profile.name);
    }
    if (profile.cgpa) {
      setCgpa(profile.cgpa);
    }
    if (profile.usn) {
      setUsn(profile.usn);
    }
    if (profile.targetRole) {
      setTargetRole(profile.targetRole);
    }
    if (profile.skills.length > 0) {
      setSkills(profile.skills);
    }
  }, []);

  const upsertRoadmap = useCallback((data: RoadmapData) => {
    if (
      !data.plan ||
      (data.plan.active_sequence.length === 0 &&
        data.plan.completed.length === 0)
    ) {
      return;
    }
    const id = roadmapKey(data.company, data.role);
    const next: TrackedRoadmap = {
      company: data.company,
      id,
      plan: data.plan,
      role: data.role,
      updatedAt: Date.now(),
    };
    setRoadmaps((current) =>
      [next, ...current.filter((roadmap) => roadmap.id !== id)].slice(0, 12)
    );
  }, []);

  const removeRoadmap = useCallback((roadmapId: string) => {
    setRoadmaps((current) =>
      current.filter((roadmap) => roadmap.id !== roadmapId)
    );
  }, []);

  const setRoadmapSkillStatus = useCallback(
    (
      roadmapId: string,
      skill: string,
      skillStatus: SkillProgressStatus,
      fallback?: RoadmapData
    ) => {
      setRoadmaps((current) => {
        const existing = current.find((roadmap) => roadmap.id === roadmapId);
        const source =
          existing ??
          (fallback?.plan
            ? {
                company: fallback.company,
                id: roadmapId,
                plan: fallback.plan,
                role: fallback.role,
                updatedAt: Date.now(),
              }
            : null);
        if (!source) {
          return current;
        }
        const next: TrackedRoadmap = {
          ...source,
          plan: applyRoadmapStatus(source.plan, skill, skillStatus),
          updatedAt: Date.now(),
        };
        return [
          next,
          ...current.filter((roadmap) => roadmap.id !== roadmapId),
        ].slice(0, 12);
      });
    },
    []
  );

  const studentContext = useMemo<StudentContext>(
    () => ({
      ...(cgpa.trim() ? { cgpa: cgpa.trim() } : {}),
      ...(college.trim() ? { college: college.trim() } : {}),
      ...(degree.trim() ? { degree: degree.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(targetRole.trim() ? { targetRole: targetRole.trim() } : {}),
      ...(usn.trim() ? { usn: usn.trim().toUpperCase() } : {}),
      roadmapProgress: roadmaps.map((roadmap) => ({
        company: roadmap.company,
        key: roadmap.id,
        role: roadmap.role,
        skills: {
          ...Object.fromEntries(
            roadmap.plan.active_sequence.map((item) => [
              item.skill,
              item.status,
            ])
          ),
          ...Object.fromEntries(
            roadmap.plan.completed.map((item) => [item.skill, item.status])
          ),
        },
      })),
      skills,
    }),
    [cgpa, college, degree, email, name, roadmaps, skills, targetRole, usn]
  );

  const value = useMemo(
    () => ({
      applyProfile,
      cgpa,
      college,
      degree,
      email,
      name,
      profileOpen,
      removeRoadmap,
      resumeName,
      roadmaps,
      setCgpa,
      setCollege,
      setDegree,
      setEmail,
      setName,
      setProfileOpen,
      setResumeName,
      setRoadmapSkillStatus,
      setSkills,
      setTargetRole,
      setUsn,
      skills,
      studentContext,
      targetRole,
      upsertRoadmap,
      usn,
    }),
    [
      applyProfile,
      cgpa,
      college,
      degree,
      email,
      name,
      profileOpen,
      removeRoadmap,
      resumeName,
      roadmaps,
      setRoadmapSkillStatus,
      skills,
      studentContext,
      targetRole,
      upsertRoadmap,
      usn,
    ]
  );

  return (
    <PlacementContext.Provider value={value}>
      {children}
    </PlacementContext.Provider>
  );
}

export function usePlacement() {
  const context = useContext(PlacementContext);
  if (!context) {
    throw new Error("usePlacement must be used within a PlacementProvider");
  }
  return context;
}
