import { askGenieAgent, isGenieConfigured } from "./databricks-genie";
import { parseGenieAnswer } from "./parse-genie";
import { CAMPUS_COMPANY_PATTERN, CAMPUS_ROLE_PATTERN } from "./question-scope";
import { applyLocalReadiness } from "./skill-match";
import type { GenieResponse, StudentContext } from "./types";

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseTarget(question: string) {
  const companyMatch = question.match(CAMPUS_COMPANY_PATTERN);
  const roleMatch = question.match(CAMPUS_ROLE_PATTERN);
  return {
    company: companyMatch ? titleCase(companyMatch[0]) : undefined,
    role: roleMatch ? titleCase(roleMatch[0]) : undefined,
  };
}

export async function queryGenie(
  question: string,
  studentContext: StudentContext,
  conversationKey?: string
): Promise<GenieResponse> {
  if (!isGenieConfigured()) {
    throw new Error(
      "Databricks Genie is not configured. Set DATABRICKS_HOST, DATABRICKS_TOKEN, and DATABRICKS_GENIE_AGENT_ID."
    );
  }

  const fromQuestion = parseTarget(question);
  const answer = await askGenieAgent({
    conversationKey,
    question,
    studentContext,
  });
  const parsed = applyLocalReadiness(
    parseGenieAnswer(answer, 0),
    studentContext
  );

  return {
    answer,
    company: parsed.company ?? fromQuestion.company,
    missingSkills: parsed.missingSkills,
    prose: parsed.prose,
    readinessScore: parsed.score,
    role: parsed.role ?? fromQuestion.role,
    tables: parsed.tables,
  };
}
