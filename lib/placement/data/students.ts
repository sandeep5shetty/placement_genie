import type { CatalogScore, CatalogStudent } from "./schema";

const BRANCHES = ["CSE", "ISE", "ECE", "AIML"] as const;
const SKILL_POOL = [
  ["DSA", "Java", "SQL"],
  ["DSA", "React", "Python"],
  ["SQL", "Python", "Spark"],
  ["DSA", "Java", "System Design"],
  ["Aptitude", "SQL", "Java"],
  ["DSA", "React", "SQL"],
  ["Python", "SQL", "DBMS"],
  ["DSA", "OS", "Java"],
];

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export const students: CatalogStudent[] = Array.from(
  { length: 50 },
  (_, index) => {
    const n = index + 1;
    const skills = SKILL_POOL[index % SKILL_POOL.length] ?? ["DSA"];
    return {
      backlog_count: n % 11 === 0 ? 1 : 0,
      branch: BRANCHES[index % BRANCHES.length] ?? "CSE",
      cgpa: round1(6.2 + ((index * 7) % 37) / 10),
      semester: 5 + (index % 3),
      skills,
      student_id: `STU${String(n).padStart(3, "0")}`,
    };
  }
);

export const studentScores: CatalogScore[] = students.flatMap(
  (student, index) => {
    const base = 55 + ((index * 13) % 40);
    return [
      {
        date: "2026-08-12",
        score: Math.min(98, base + 4),
        student_id: student.student_id,
        test_type: "mock_dsa",
      },
      {
        date: "2026-08-14",
        score: Math.min(98, base - 3),
        student_id: student.student_id,
        test_type: "aptitude",
      },
      {
        date: "2026-08-18",
        score: Math.min(98, base + 1),
        student_id: student.student_id,
        test_type: "mock_interview",
      },
    ];
  }
);
