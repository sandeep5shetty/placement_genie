import assert from "node:assert/strict";
import test from "node:test";
import { getFunnelChartData } from "../../components/placement-cell/analytics-utils";
import { verifyPlacementCellCode } from "../../lib/placement-cell/auth";
import {
  extractSuggestedQuestions,
  hasFunnelData,
  isStudentDirectory,
  parseAnalyticsAnswer,
} from "../../lib/placement-cell/parse-analytics";

test("verifyPlacementCellCode uses timing-safe comparison", () => {
  const previous = process.env.PLACEMENT_CELL_CODE;
  process.env.PLACEMENT_CELL_CODE = "campus-2026";

  assert.equal(verifyPlacementCellCode("campus-2026"), true);
  assert.equal(verifyPlacementCellCode("wrong-code"), false);

  process.env.PLACEMENT_CELL_CODE = previous;
});

test("parseAnalyticsAnswer extracts markdown tables", () => {
  const answer = `
Summary line

| company_name | applicants | shortlisted | selected |
| --- | --- | --- | --- |
| Amazon | 120 | 40 | 12 |
`;

  const parsed = parseAnalyticsAnswer(answer);

  assert.equal(parsed.queryResults.length, 1);
  assert.deepEqual(parsed.queryResults[0]?.columns, [
    "company_name",
    "applicants",
    "shortlisted",
    "selected",
  ]);
  assert.equal(parsed.queryResults[0]?.rows.length, 1);
  assert.equal(hasFunnelData(parsed.queryResults[0]!), true);
});

test("getFunnelChartData aggregates duplicate drive labels", () => {
  const result = {
    columns: ["company_name", "role", "applicants", "shortlisted", "selected"],
    id: "funnel",
    rows: [
      {
        applicants: 10,
        company_name: "Amazon",
        role: "SDE",
        selected: 2,
        shortlisted: 5,
      },
      {
        applicants: 5,
        company_name: "Amazon",
        role: "SDE",
        selected: 1,
        shortlisted: 2,
      },
    ],
  };

  const chartData = getFunnelChartData(result);
  assert.equal(chartData.length, 1);
  assert.equal(chartData[0]?.applicants, 15);
  assert.equal(chartData[0]?.shortlisted, 7);
  assert.equal(chartData[0]?.selected, 3);
});

test("isStudentDirectory detects student-level tables", () => {
  const result = {
    columns: ["student_id", "name", "branch", "cgpa"],
    id: "students",
    rows: [{ branch: "CSE", cgpa: 8.2, name: "Asha", student_id: "1BM25MC001" }],
  };

  assert.equal(isStudentDirectory(result), true);
});

test("extractSuggestedQuestions finds bullet questions", () => {
  const answer = `
- Which companies have the lowest conversion rate?
- Show at-risk students by branch?
`;

  const questions = extractSuggestedQuestions(answer);
  assert.equal(questions.length, 2);
});
