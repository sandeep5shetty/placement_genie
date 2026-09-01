import { generateObject } from "ai";
import { z } from "zod";
import { titleModel } from "@/lib/ai/models";
import { getLanguageModel } from "@/lib/ai/providers";

export const CAMPUS_COMPANY_PATTERN =
  /\b(google|microsoft|amazon|meta|netflix|apple|databricks|uber|linkedin|adobe|salesforce|oracle|ibm|infosys|tcs|wipro|accenture|honeywell|cognizant|capgemini|flipkart|phonepe|intuit)\b/i;

export const CAMPUS_ROLE_PATTERN =
  /\b(sde intern|swe intern|software engineer intern|software engineer|data scientist|data analyst|product analyst|ml engineer|data engineer|frontend|backend|full[- ]?stack|sde|swe|intern(?:ship)?|ninja|systems engineer)\b/i;

const CAMPUS_TOPIC_PATTERN =
  /\b(placement|campus(?: drive)?|recruit(?:ment|er)?|readiness|ready|cgpa|gpa|skill(?:s| gap)?|roadmap|resume|shortlist|package|coding round|aptitude|mock interview|dsa|leetcode|cutoff|required skills?)\b/i;

const GREETING_PATTERN =
  /^(hi|hello|hey|yo|thanks|thank you|good (morning|afternoon|evening)|what can you do|who are you)\b/i;

const OFF_TOPIC_CAREER_PATTERN =
  /\b(truck driver|lorry|truck|cab driver|taxi driver|pilot|chef|cook|plumber|electrician|farmer|actor|nurse|doctor|soldier|mechanic|barber|waiter|delivery (boy|agent)|construction worker|welder)\b/i;

export type QuestionScope =
  | "in_scope"
  | "out_of_scope"
  | "greeting"
  | "uncertain";

export type QuestionEvaluation = {
  reply: string;
  scope: Exclude<QuestionScope, "uncertain">;
};

const OUT_OF_SCOPE_REPLY =
  "I only answer campus placement questions from our company and role data — readiness, CGPA cutoffs, skill gaps, and study roadmaps. That isn’t something I can evaluate here. Try a campus role, for example “Am I ready for Amazon SDE Intern?”";

const GREETING_REPLY =
  "I’m the Placement Readiness Genie. Ask whether you match a campus company and role, what skills you’re missing, or what to study next.";

const evaluationSchema = z.object({
  inScope: z.boolean(),
  reply: z.string().max(400),
});

export function classifyPlacementQuestion(question: string): QuestionScope {
  const trimmed = question.trim();
  if (trimmed.length === 0) {
    return "greeting";
  }

  if (GREETING_PATTERN.test(trimmed) && trimmed.split(/\s+/).length <= 8) {
    return "greeting";
  }

  const hasOffTopicCareer = OFF_TOPIC_CAREER_PATTERN.test(trimmed);
  const hasCampusRole = CAMPUS_ROLE_PATTERN.test(trimmed);

  if (hasOffTopicCareer && !hasCampusRole) {
    return "out_of_scope";
  }

  if (
    CAMPUS_TOPIC_PATTERN.test(trimmed) ||
    CAMPUS_COMPANY_PATTERN.test(trimmed) ||
    hasCampusRole
  ) {
    return "in_scope";
  }

  return "uncertain";
}

function scopedReply(
  scope: Exclude<QuestionScope, "uncertain">
): QuestionEvaluation {
  if (scope === "greeting") {
    return { reply: GREETING_REPLY, scope };
  }
  if (scope === "out_of_scope") {
    return { reply: OUT_OF_SCOPE_REPLY, scope };
  }
  return { reply: "", scope };
}

export async function evaluatePlacementQuestion(
  question: string
): Promise<QuestionEvaluation> {
  const classified = classifyPlacementQuestion(question);
  if (classified !== "uncertain") {
    return scopedReply(classified);
  }

  try {
    const { object } = await generateObject({
      model: getLanguageModel(titleModel.id),
      prompt: `You gate questions for a campus placement chatbot.

IN SCOPE only if the student is asking about campus-visiting companies/roles, CGPA vs cutoff, required or missing skills, internships from the placement season, or a study roadmap for those roles.

OUT OF SCOPE: unrelated careers, general knowledge, jokes, homework, news, or anything not answerable from campus placement tables.

Question: ${question.slice(0, 800)}

If out of scope, write a short reply that refuses and points the student back to campus company/role questions. If in scope, set reply to "".`,
      schema: evaluationSchema,
    });

    if (object.inScope) {
      return { reply: "", scope: "in_scope" };
    }

    return {
      reply: object.reply.trim() || OUT_OF_SCOPE_REPLY,
      scope: "out_of_scope",
    };
  } catch {
    return scopedReply("out_of_scope");
  }
}
