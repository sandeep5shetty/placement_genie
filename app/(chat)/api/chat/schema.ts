import { z } from "zod";

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(["text"]),
});

const filePartSchema = z.object({
  mediaType: z.enum(["image/jpeg", "image/png"]),
  name: z.string().min(1).max(100),
  type: z.enum(["file"]),
  url: z.url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.uuid(),
  parts: z.array(partSchema),
  role: z.enum(["user"]),
});

const toolApprovalMessageSchema = z.object({
  id: z.string(),
  parts: z.array(z.record(z.string(), z.unknown())),
  role: z.enum(["user", "assistant"]),
});

const skillProgressSchema = z.enum(["not_started", "in_progress", "completed"]);

const studentContextSchema = z.object({
  cgpa: z.string().max(32).optional(),
  college: z.string().max(160).optional(),
  degree: z.string().max(120).optional(),
  email: z.string().max(160).optional(),
  name: z.string().max(120).optional(),
  roadmapProgress: z
    .array(
      z.object({
        company: z.string().max(120).optional(),
        key: z.string().max(160),
        role: z.string().max(120).optional(),
        skills: z.record(z.string(), skillProgressSchema),
      })
    )
    .max(20)
    .optional(),
  skills: z
    .array(z.string())
    .max(80)
    .transform((skills) =>
      skills
        .map((skill) => skill.trim())
        .filter(Boolean)
        .map((skill) => skill.slice(0, 80))
        .slice(0, 40)
    ),
  targetRole: z.string().max(120).optional(),
  usn: z.string().max(32).optional(),
});

export const postRequestBodySchema = z.object({
  id: z.uuid(),
  message: userMessageSchema.optional(),
  messages: z.array(toolApprovalMessageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
  studentContext: studentContextSchema.optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
