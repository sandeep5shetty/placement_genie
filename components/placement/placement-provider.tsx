"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { StudentContext, StudentProfile } from "@/lib/placement/types";

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
  targetRole: string;
  setTargetRole: Dispatch<SetStateAction<string>>;
  skills: string[];
  setSkills: Dispatch<SetStateAction<string[]>>;
  resumeName: string | null;
  setResumeName: Dispatch<SetStateAction<string | null>>;
  profileOpen: boolean;
  setProfileOpen: Dispatch<SetStateAction<boolean>>;
  applyProfile: (profile: StudentProfile) => void;
  studentContext: StudentContext;
};

const PlacementContext = createContext<PlacementContextValue | null>(null);

export function PlacementProvider({ children }: { children: ReactNode }) {
  const [college, setCollege] = useState("");
  const [degree, setDegree] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

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
    if (profile.targetRole) {
      setTargetRole(profile.targetRole);
    }
    if (profile.skills.length > 0) {
      setSkills(profile.skills);
    }
  }, []);

  const studentContext = useMemo<StudentContext>(
    () => ({
      ...(cgpa.trim() ? { cgpa: cgpa.trim() } : {}),
      ...(college.trim() ? { college: college.trim() } : {}),
      ...(degree.trim() ? { degree: degree.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(targetRole.trim() ? { targetRole: targetRole.trim() } : {}),
      skills,
    }),
    [cgpa, college, degree, email, name, skills, targetRole]
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
      skills,
      studentContext,
      targetRole,
    }),
    [
      applyProfile,
      cgpa,
      college,
      degree,
      email,
      name,
      profileOpen,
      resumeName,
      skills,
      studentContext,
      targetRole,
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
