import { generateObject } from "ai";
import { z } from "zod";
import { titleModel } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";
import { extractCgpaFromText } from "./extract-cgpa";
import {
  extractProfileHeuristically,
  mergeProfiles,
} from "./extract-heuristic";
import { extractUsnFromText } from "./extract-usn";
import type { StudentProfile } from "./types";

const profileSchema = z.object({
  cgpa: z.string().max(16).optional(),
  college: z.string().max(120).optional(),
  degree: z.string().max(80).optional(),
  email: z.string().max(120).optional(),
  name: z.string().max(80).optional(),
  skills: z.array(z.string().min(1).max(40)).max(40),
  targetRole: z.string().max(80).optional(),
  usn: z.string().max(20).optional(),
});

function cleanOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function extractProfileFromResumeText(
  resumeText: string
): Promise<StudentProfile> {
  const heuristic = extractProfileHeuristically(resumeText);
  const clipped = resumeText.slice(0, 14_000);

  try {
    const { object } = await generateObject({
      model: getLanguageModel(titleModel.id),
      prompt: `Extract a campus placement profile from this resume.
Return:
- name
- email
- usn (University Seat Number / SRN / student id, e.g. 1BM25MC001)
- college / university
- degree (for example B.Tech CSE)
- cgpa as a number string if present (examples: "8.72", "8.4/10", "3.8/4"). Look for CGPA, GPA, SGPA, and "x/10".
- targetRole if a preferred role is mentioned
- skills: technical skills only

Resume:
${clipped}`,
      schema: profileSchema,
    });

    const uniqueSkills = [
      ...new Set(object.skills.map((skill) => skill.trim())),
    ].filter(Boolean);

    return mergeProfiles(
      {
        cgpa: extractCgpaFromText(resumeText) ?? cleanOptional(object.cgpa),
        college: cleanOptional(object.college),
        degree: cleanOptional(object.degree),
        email: cleanOptional(object.email),
        name: cleanOptional(object.name),
        skills: uniqueSkills.slice(0, 24),
        targetRole: cleanOptional(object.targetRole),
        usn:
          extractUsnFromText(resumeText) ??
          cleanOptional(object.usn)?.toUpperCase(),
      },
      heuristic
    );
  } catch {
    return heuristic;
  }
}
