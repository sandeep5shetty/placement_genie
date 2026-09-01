import type { PlacementCellNavItem } from "./types";

export const placementCellNavItems: PlacementCellNavItem[] = [
  {
    label: "Placement Overview",
    question:
      "Give me a concise placement overview. Calculate total applicants, shortlisted candidates, selected candidates, overall placement rate, and shortlist-to-selection conversion using the available placement drive data. Summarize recent drive outcomes and identify the single most important trend to act on. Return aggregated recruitment funnel plus company/role-level outcomes suitable for visualization.",
  },
  {
    label: "Recruitment Insights",
    question:
      "Analyze recruitment performance by company and drive. Highlight conversion rates, bottlenecks, and opportunities to improve selections. Return chart-friendly columns including company_name, role, applicants, shortlisted, and selected where available.",
  },
  {
    label: "Student Directory",
    question:
      "List student-level placement readiness details from campus placement tables. Include student_id, name, branch, cgpa, skills, backlog count, and readiness indicators where available. Return a tabular result suitable for a searchable student directory.",
  },
  {
    label: "At-Risk Students",
    question:
      "Identify at-risk student groups using academic performance, assessment scores, roadmap progress, and placement readiness. Explain why each group needs attention and return student-level rows with cgpa, skills, and risk indicators.",
  },
  {
    label: "Skill Gap Analysis",
    question:
      "Identify the highest-impact skill gaps based on employer requirements, student skill progress, assessments, and placement outcomes. Return aggregate and student-level columns suitable for charts.",
  },
  {
    label: "Intervention Plans",
    question:
      "Based on available placement data, recommend prioritized evidence-based interventions for the placement team. Clearly distinguish observed patterns from recommendations. Include supporting metrics in tabular form where possible.",
  },
];

export const placementCellWelcomePrompts = [
  {
    content:
      "Analyze the overall placement performance across all recruitment drives. Calculate applicant-to-shortlist and applicant-to-selection conversion rates. Identify the strongest and weakest trends across companies, roles, and time periods.",
    title: "Overall Placement Performance",
  },
  {
    content:
      "Identify recruitment drives with the largest drop-offs between applicants, shortlisted candidates, and selected candidates. Compare conversion rates and identify where the recruitment funnel is weakest.",
    title: "Recruitment Bottlenecks",
  },
  {
    content:
      "Analyze student academic performance, assessment scores, backlogs, and roadmap progress. Identify aggregate student groups that may require additional placement preparation and explain the evidence.",
    title: "Student Readiness",
  },
  {
    content:
      "Analyze student skills, roadmap progress, assessment performance, company requirements, and placement outcomes. Identify the most important skill gaps affecting placement readiness and prioritize them based on evidence.",
    title: "Skill Gap Analysis",
  },
  {
    content:
      "Based on recruitment bottlenecks, student readiness patterns, assessment performance, and skill gaps, recommend the top evidence-based interventions the placement team should prioritize. Clearly separate observed findings from recommendations.",
    title: "Intervention Strategy",
  },
];

export function buildPlacementCellPrompt(question: string) {
  return [
    "You are Placement Intelligence for the campus placement cell.",
    "Answer using aggregate campus placement data only. Do not scope answers to a single student unless the question explicitly asks for student-level detail.",
    "Prefer structured markdown tables with clear column headers when returning numeric or student data.",
    "Include applicants, shortlisted, and selected counts when analyzing recruitment drives.",
    "Do not emit citation markers such as ]] or \\].",
    "After tables, write a short executive summary.",
    "",
    `Question: ${question}`,
  ].join("\n");
}
