"""
Generate Placement Readiness Genie CSVs (spec 3.1).

Must-have
  students, companies, student_scores, skill_courses
Nice-to-have
  placement_drives, roadmap_progress

Students  100  (USN 1BM25MC001 … 1BM25MC100)
Companies  30  (typical Indian campus visitors)
Scores      300  (every student × mock_dsa / aptitude / mock_interview)

Run locally:
  python databricks/generate_placement_data.py

Also writes:
  databricks/genie/INSTRUCTIONS.md
  databricks/genie/sample_questions.sql   (verified SQL + expected answers)

Demo row (use this in Genie + live demo):
  student_id = 1BM25MC001
  cgpa       = 8.2
  skills     = DSA,React,Python,SQL
  company    = Amazon / SDE Intern  (CMP001)
  min_cgpa   = 7.5
  required   = DSA,React,System Design
  Expected story: meets CGPA, has DSA+React (67%), missing System Design.
"""

from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path

SEED = 42
N_STUDENTS = 100
USN_PREFIX = "1BM25MC"
CATALOG = "campus"
SCHEMA = "placement"
TABLE = f"{CATALOG}.{SCHEMA}"

BRANCHES = ["CSE", "ISE", "AIML", "ECE", "EEE", "MCA"]
SEMESTERS = [1, 2, 3, 4]
SKILL_POOL = [
    "DSA",
    "Aptitude",
    "SQL",
    "Java",
    "Python",
    "React",
    "OS",
    "DBMS",
    "Spark",
    "System Design",
]
TEST_TYPES = ["mock_dsa", "aptitude", "mock_interview"]
PROGRESS_STATUSES = ["not_started", "in_progress", "completed"]
CGPA_BANDS = [
    ("6.0-6.99", 6.0, 7.0),
    ("7.0-7.49", 7.0, 7.5),
    ("7.5-7.99", 7.5, 8.0),
    ("8.0-8.49", 8.0, 8.5),
    ("8.5-10.0", 8.5, 10.1),
]
DRIVE_YEARS = [2024, 2025]

# Must-have skill_courses: one sequenced resource per campus skill.
SKILL_COURSES = [
    {
        "course_or_resource": "NeetCode 150 — arrays, hashing, two pointers, trees",
        "difficulty_order": 1,
        "estimated_duration": "2 weeks",
        "skill": "DSA",
    },
    {
        "course_or_resource": "Campus contest set — weekly CodeChef / LeetCode mediums",
        "difficulty_order": 2,
        "estimated_duration": "2 weeks",
        "skill": "DSA",
    },
    {
        "course_or_resource": "IndiaBix + campus aptitude mocks (quant + logical)",
        "difficulty_order": 1,
        "estimated_duration": "1 week",
        "skill": "Aptitude",
    },
    {
        "course_or_resource": "Mode SQL tutorial + 20 interview questions",
        "difficulty_order": 1,
        "estimated_duration": "1 week",
        "skill": "SQL",
    },
    {
        "course_or_resource": "Window functions and CTEs — 15 interview drills",
        "difficulty_order": 2,
        "estimated_duration": "5 days",
        "skill": "SQL",
    },
    {
        "course_or_resource": "Java collections + OOP interview drills",
        "difficulty_order": 1,
        "estimated_duration": "1 week",
        "skill": "Java",
    },
    {
        "course_or_resource": "Python for interviews (functions, pandas, complexity)",
        "difficulty_order": 1,
        "estimated_duration": "1 week",
        "skill": "Python",
    },
    {
        "course_or_resource": "Build one production-style CRUD app and explain it",
        "difficulty_order": 1,
        "estimated_duration": "1 week",
        "skill": "React",
    },
    {
        "course_or_resource": "OS concepts: processes, threads, deadlocks, memory",
        "difficulty_order": 1,
        "estimated_duration": "1 week",
        "skill": "OS",
    },
    {
        "course_or_resource": "DBMS: indexing, transactions, normalization drills",
        "difficulty_order": 1,
        "estimated_duration": "5 days",
        "skill": "DBMS",
    },
    {
        "course_or_resource": "Databricks Academy: Spark fundamentals + one ETL notebook",
        "difficulty_order": 1,
        "estimated_duration": "1 week",
        "skill": "Spark",
    },
    {
        "course_or_resource": "Grokking System Design — URL shortener, news feed, chat",
        "difficulty_order": 1,
        "estimated_duration": "2 weeks",
        "skill": "System Design",
    },
]

COMPANIES = [
    {
        "company_id": "CMP001",
        "job_description": "Campus SDE intern: DSA screening, React for product UI, and basic system design.",
        "min_cgpa": 7.5,
        "name": "Amazon",
        "package": 28.0,
        "required_skills": "DSA,React,System Design",
        "role": "SDE Intern",
        "visiting_date": "2026-09-18",
    },
    {
        "company_id": "CMP002",
        "job_description": "SWE intern: algorithms, Java/C++, OS, and scalable service design.",
        "min_cgpa": 8.5,
        "name": "Google",
        "package": 32.0,
        "required_skills": "DSA,Java,OS,System Design",
        "role": "SWE Intern",
        "visiting_date": "2026-10-03",
    },
    {
        "company_id": "CMP003",
        "job_description": "Azure-facing product intern: DSA, Python/SQL, and system design.",
        "min_cgpa": 8.0,
        "name": "Microsoft",
        "package": 26.0,
        "required_skills": "DSA,Python,SQL,System Design",
        "role": "SDE Intern",
        "visiting_date": "2026-10-08",
    },
    {
        "company_id": "CMP004",
        "job_description": "Controls and software intern for industrial systems; C/Java, OS, and aptitude.",
        "min_cgpa": 7.0,
        "name": "Honeywell",
        "package": 12.0,
        "required_skills": "Java,OS,Aptitude",
        "role": "Software Engineer Intern",
        "visiting_date": "2026-09-22",
    },
    {
        "company_id": "CMP005",
        "job_description": "Ninja profile: aptitude plus basic Java for mass campus hiring.",
        "min_cgpa": 6.0,
        "name": "TCS",
        "package": 3.6,
        "required_skills": "Aptitude,Java",
        "role": "Ninja",
        "visiting_date": "2026-08-28",
    },
    {
        "company_id": "CMP006",
        "job_description": "Systems engineer: aptitude, Java, and SQL for client projects.",
        "min_cgpa": 6.5,
        "name": "Infosys",
        "package": 4.5,
        "required_skills": "Aptitude,Java,SQL",
        "role": "Systems Engineer",
        "visiting_date": "2026-09-04",
    },
    {
        "company_id": "CMP007",
        "job_description": "Project engineer: aptitude, SQL, and DBMS for enterprise delivery.",
        "min_cgpa": 6.5,
        "name": "Wipro",
        "package": 4.0,
        "required_skills": "Aptitude,SQL,DBMS",
        "role": "Project Engineer",
        "visiting_date": "2026-09-10",
    },
    {
        "company_id": "CMP008",
        "job_description": "Associate software engineer: Java, SQL, and aptitude for consulting delivery.",
        "min_cgpa": 6.5,
        "name": "Accenture",
        "package": 4.8,
        "required_skills": "Aptitude,Java,SQL",
        "role": "Associate Software Engineer",
        "visiting_date": "2026-09-14",
    },
    {
        "company_id": "CMP009",
        "job_description": "GenC: Java, SQL, and aptitude for digital engineering programs.",
        "min_cgpa": 6.5,
        "name": "Cognizant",
        "package": 4.5,
        "required_skills": "Aptitude,Java,SQL",
        "role": "GenC",
        "visiting_date": "2026-09-16",
    },
    {
        "company_id": "CMP010",
        "job_description": "Analyst: Java/SQL plus aptitude for transformation programs.",
        "min_cgpa": 6.5,
        "name": "Capgemini",
        "package": 4.5,
        "required_skills": "Aptitude,Java,SQL",
        "role": "Analyst",
        "visiting_date": "2026-09-20",
    },
    {
        "company_id": "CMP011",
        "job_description": "Application developer: Java, SQL, and DBMS.",
        "min_cgpa": 6.5,
        "name": "IBM",
        "package": 6.5,
        "required_skills": "Java,SQL,DBMS",
        "role": "Application Developer",
        "visiting_date": "2026-09-24",
    },
    {
        "company_id": "CMP012",
        "job_description": "Graduate engineer trainee: Java and aptitude.",
        "min_cgpa": 6.5,
        "name": "HCLTech",
        "package": 4.2,
        "required_skills": "Aptitude,Java",
        "role": "Graduate Engineer Trainee",
        "visiting_date": "2026-09-26",
    },
    {
        "company_id": "CMP013",
        "job_description": "Analyst: SQL, Python, and aptitude for consulting projects.",
        "min_cgpa": 7.0,
        "name": "Deloitte",
        "package": 8.0,
        "required_skills": "SQL,Python,Aptitude",
        "role": "Analyst",
        "visiting_date": "2026-10-01",
    },
    {
        "company_id": "CMP014",
        "job_description": "Adobe product intern: DSA, Java, and system design.",
        "min_cgpa": 8.0,
        "name": "Adobe",
        "package": 24.0,
        "required_skills": "DSA,Java,System Design",
        "role": "SDE Intern",
        "visiting_date": "2026-10-06",
    },
    {
        "company_id": "CMP015",
        "job_description": "Networking/software intern: DSA, OS, and C/Java.",
        "min_cgpa": 7.5,
        "name": "Cisco",
        "package": 16.0,
        "required_skills": "DSA,OS,Java",
        "role": "Software Engineer Intern",
        "visiting_date": "2026-10-10",
    },
    {
        "company_id": "CMP016",
        "job_description": "Database and cloud apps: Java, SQL, DBMS.",
        "min_cgpa": 7.0,
        "name": "Oracle",
        "package": 12.0,
        "required_skills": "Java,SQL,DBMS",
        "role": "Applications Engineer",
        "visiting_date": "2026-10-12",
    },
    {
        "company_id": "CMP017",
        "job_description": "ABAP/cloud adjacent developer: SQL, Java, aptitude.",
        "min_cgpa": 7.0,
        "name": "SAP",
        "package": 11.0,
        "required_skills": "SQL,Java,Aptitude",
        "role": "Associate Developer",
        "visiting_date": "2026-10-14",
    },
    {
        "company_id": "CMP018",
        "job_description": "Salesforce intern: DSA, Java, and system design basics.",
        "min_cgpa": 7.5,
        "name": "Salesforce",
        "package": 18.0,
        "required_skills": "DSA,Java,System Design",
        "role": "SDE Intern",
        "visiting_date": "2026-10-18",
    },
    {
        "company_id": "CMP019",
        "job_description": "Automotive embedded/software intern: OS, Java, aptitude.",
        "min_cgpa": 7.0,
        "name": "Bosch",
        "package": 8.5,
        "required_skills": "OS,Java,Aptitude",
        "role": "Software Intern",
        "visiting_date": "2026-10-20",
    },
    {
        "company_id": "CMP020",
        "job_description": "Semiconductor software intern: DSA, OS, and C/Java.",
        "min_cgpa": 7.5,
        "name": "Qualcomm",
        "package": 20.0,
        "required_skills": "DSA,OS,Java",
        "role": "Software Engineer Intern",
        "visiting_date": "2026-10-22",
    },
    {
        "company_id": "CMP021",
        "job_description": "Intel software intern: OS, C/Java, and DSA.",
        "min_cgpa": 7.5,
        "name": "Intel",
        "package": 18.0,
        "required_skills": "DSA,OS,Java",
        "role": "Software Engineer Intern",
        "visiting_date": "2026-10-24",
    },
    {
        "company_id": "CMP022",
        "job_description": "Product SDE: strong DSA and Java, some system design.",
        "min_cgpa": 7.0,
        "name": "Zoho",
        "package": 10.0,
        "required_skills": "DSA,Java,System Design",
        "role": "SDE",
        "visiting_date": "2026-10-28",
    },
    {
        "company_id": "CMP023",
        "job_description": "SaaS intern: DSA, React, and SQL.",
        "min_cgpa": 7.0,
        "name": "Freshworks",
        "package": 12.0,
        "required_skills": "DSA,React,SQL",
        "role": "SDE Intern",
        "visiting_date": "2026-10-30",
    },
    {
        "company_id": "CMP024",
        "job_description": "Ecommerce SDE intern: DSA, Java, system design.",
        "min_cgpa": 7.5,
        "name": "Flipkart",
        "package": 21.0,
        "required_skills": "DSA,Java,System Design",
        "role": "SDE Intern",
        "visiting_date": "2026-11-04",
    },
    {
        "company_id": "CMP025",
        "job_description": "Walmart Global Tech intern: DSA, Java, system design.",
        "min_cgpa": 7.5,
        "name": "Walmart Global Tech",
        "package": 20.0,
        "required_skills": "DSA,Java,System Design",
        "role": "SDE Intern",
        "visiting_date": "2026-11-06",
    },
    {
        "company_id": "CMP026",
        "job_description": "Payments intern: DSA, Java, system design.",
        "min_cgpa": 7.5,
        "name": "PhonePe",
        "package": 18.0,
        "required_skills": "DSA,Java,System Design",
        "role": "SDE Intern",
        "visiting_date": "2026-11-08",
    },
    {
        "company_id": "CMP027",
        "job_description": "Engineering summer analyst: DSA, Python, SQL, aptitude.",
        "min_cgpa": 8.0,
        "name": "Goldman Sachs",
        "package": 30.0,
        "required_skills": "DSA,Python,SQL,Aptitude",
        "role": "Summer Analyst",
        "visiting_date": "2026-11-10",
    },
    {
        "company_id": "CMP028",
        "job_description": "Software engineer intern: DSA, Java, and SQL.",
        "min_cgpa": 7.5,
        "name": "JPMorgan Chase",
        "package": 22.0,
        "required_skills": "DSA,Java,SQL",
        "role": "Software Engineer Intern",
        "visiting_date": "2026-11-12",
    },
    {
        "company_id": "CMP029",
        "job_description": "Intuit intern: DSA, React, and SQL for fintech products.",
        "min_cgpa": 7.5,
        "name": "Intuit",
        "package": 18.0,
        "required_skills": "DSA,React,SQL",
        "role": "SDE Intern",
        "visiting_date": "2026-11-14",
    },
    {
        "company_id": "CMP030",
        "job_description": "Lakehouse intern: Python, SQL, Spark, and system design.",
        "min_cgpa": 8.0,
        "name": "Databricks",
        "package": 22.0,
        "required_skills": "Python,SQL,Spark,System Design",
        "role": "Data Engineer Intern",
        "visiting_date": "2026-11-18",
    },
]


def usn(index: int) -> str:
    return f"{USN_PREFIX}{index:03d}"


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def sample_cgpa(rng: random.Random) -> float:
    value = rng.gauss(7.95, 0.72)
    return round(clamp(value, 6.1, 9.6), 2)


def sample_skills(rng: random.Random, branch: str) -> str:
    core = ["DSA", "Aptitude"]
    if branch in {"CSE", "ISE", "AIML", "MCA"}:
        core.extend(["Python", "SQL"])
    else:
        core.extend(["Java", "OS"])

    extras = [skill for skill in SKILL_POOL if skill not in core]
    extra_count = rng.randint(1, 3)
    picked = core + rng.sample(extras, k=min(extra_count, len(extras)))
    if "System Design" in picked and rng.random() < 0.7:
        picked.remove("System Design")
        replacement = rng.choice(
            [skill for skill in extras if skill not in picked] or ["DBMS"]
        )
        picked.append(replacement)
    return ",".join(dict.fromkeys(picked))


def sample_backlogs(rng: random.Random, cgpa: float) -> int:
    if cgpa >= 8.5:
        return 0 if rng.random() < 0.95 else 1
    if cgpa >= 7.5:
        return rng.choice([0, 0, 0, 1])
    return rng.choice([0, 1, 1, 2])


def build_students(rng: random.Random) -> list[dict[str, object]]:
    demo_id = usn(1)
    students: list[dict[str, object]] = [
        {
            "backlog_count": 0,
            "branch": "MCA",
            "cgpa": 8.2,
            "semester": 3,
            "skills": "DSA,React,Python,SQL",
            "student_id": demo_id,
        }
    ]
    for index in range(2, N_STUDENTS + 1):
        branch = rng.choices(BRANCHES, weights=[28, 14, 12, 16, 10, 20], k=1)[0]
        cgpa = sample_cgpa(rng)
        students.append(
            {
                "backlog_count": sample_backlogs(rng, cgpa),
                "branch": branch,
                "cgpa": cgpa,
                "semester": rng.choice(SEMESTERS),
                "skills": sample_skills(rng, branch),
                "student_id": usn(index),
            }
        )
    return students


def score_from_cgpa(rng: random.Random, cgpa: float, test_type: str) -> int:
    base = 45 + (cgpa - 6.0) * 12
    jitter = rng.gauss(0, 8)
    if test_type == "mock_dsa":
        base += rng.choice([-2, 0, 4])
    elif test_type == "aptitude":
        base += rng.choice([0, 3, 6])
    else:
        base += rng.choice([-4, 0, 2])
    return int(round(clamp(base + jitter, 28, 98)))


def split_skills(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


def cgpa_band_for(cgpa: float) -> str:
    for label, low, high in CGPA_BANDS:
        if low <= cgpa < high:
            return label
    return CGPA_BANDS[-1][0]


def build_scores(
    rng: random.Random, students: list[dict[str, object]]
) -> list[dict[str, object]]:
    demo_id = usn(1)
    demo_scores = {
        "mock_dsa": (74, "2026-08-12"),
        "aptitude": (81, "2026-08-18"),
        "mock_interview": (70, "2026-08-22"),
    }
    scores: list[dict[str, object]] = []
    start = date(2026, 7, 1)
    for student in students:
        student_id = str(student["student_id"])
        for test_type in TEST_TYPES:
            if student_id == demo_id:
                score, scored_on = demo_scores[test_type]
            else:
                score = score_from_cgpa(rng, float(student["cgpa"]), test_type)
                scored_on = (start + timedelta(days=rng.randint(0, 70))).isoformat()
            scores.append(
                {
                    "date": scored_on,
                    "score": score,
                    "student_id": student_id,
                    "test_type": test_type,
                }
            )
    return scores


def build_placement_drives(rng: random.Random) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    drive_seq = 1
    for year in DRIVE_YEARS:
        for company in COMPANIES:
            drive_id = f"DRV{drive_seq:03d}"
            drive_seq += 1
            package = float(company["package"])
            month = 8 if package < 8 else 9 if package < 16 else 10
            day = rng.randint(4, 26)
            drive_date = date(year, month, min(day, 28)).isoformat()
            for band_label, low, high in CGPA_BANDS:
                mid = (low + min(high, 10.0)) / 2
                if package >= 20:
                    applicants = rng.randint(8, 22) if mid >= 8.0 else rng.randint(18, 40)
                    select_rate = 0.18 if mid >= 8.0 else 0.06
                elif package >= 10:
                    applicants = rng.randint(20, 45)
                    select_rate = 0.22 if mid >= 7.5 else 0.10
                else:
                    applicants = rng.randint(40, 90)
                    select_rate = 0.38 if mid >= 6.5 else 0.12
                if low < float(company["min_cgpa"]):
                    select_rate *= 0.15
                selected = int(round(applicants * select_rate * rng.uniform(0.75, 1.2)))
                selected = max(0, min(selected, applicants))
                shortlisted = max(selected, int(round(applicants * rng.uniform(0.28, 0.55))))
                shortlisted = min(applicants, shortlisted)
                rows.append(
                    {
                        "applicants": applicants,
                        "cgpa_band": band_label,
                        "company_id": company["company_id"],
                        "drive_date": drive_date,
                        "drive_id": drive_id,
                        "name": company["name"],
                        "role": company["role"],
                        "selected": selected,
                        "shortlisted": shortlisted,
                    }
                )
    return rows


def build_roadmap_progress(
    rng: random.Random, students: list[dict[str, object]]
) -> list[dict[str, object]]:
    demo_id = usn(1)
    rows: list[dict[str, object]] = [
        {
            "last_updated": "2026-08-20",
            "skill": "DSA",
            "status": "completed",
            "student_id": demo_id,
        },
        {
            "last_updated": "2026-08-21",
            "skill": "React",
            "status": "completed",
            "student_id": demo_id,
        },
        {
            "last_updated": "2026-08-24",
            "skill": "Python",
            "status": "in_progress",
            "student_id": demo_id,
        },
        {
            "last_updated": "2026-08-19",
            "skill": "SQL",
            "status": "completed",
            "student_id": demo_id,
        },
        {
            "last_updated": "2026-08-01",
            "skill": "System Design",
            "status": "not_started",
            "student_id": demo_id,
        },
    ]
    start = date(2026, 7, 15)
    for student in students:
        student_id = str(student["student_id"])
        if student_id == demo_id:
            continue
        owned = split_skills(str(student["skills"]))
        missing_pool = [skill for skill in SKILL_POOL if skill not in owned]
        tracked = owned[: rng.randint(1, min(3, len(owned)))]
        if missing_pool and rng.random() < 0.45:
            tracked.append(rng.choice(missing_pool))
        for skill in dict.fromkeys(tracked):
            if skill in owned:
                status = rng.choices(PROGRESS_STATUSES, weights=[10, 35, 55], k=1)[0]
            else:
                status = rng.choices(PROGRESS_STATUSES, weights=[70, 25, 5], k=1)[0]
            rows.append(
                {
                    "last_updated": (start + timedelta(days=rng.randint(0, 40))).isoformat(),
                    "skill": skill,
                    "status": status,
                    "student_id": student_id,
                }
            )
    return rows


def readiness_row(student: dict[str, object], company: dict[str, object]) -> dict[str, object]:
    have = split_skills(str(student["skills"]))
    required = split_skills(str(company["required_skills"]))
    met = [skill for skill in required if skill in have]
    missing = [skill for skill in required if skill not in have]
    cgpa = float(student["cgpa"])
    min_cgpa = float(company["min_cgpa"])
    match_pct = round(100.0 * len(met) / len(required), 1) if required else 0.0
    if cgpa >= min_cgpa and not missing:
        label = "ready"
    elif cgpa >= min_cgpa:
        label = "not fully ready — CGPA met, skills incomplete"
    else:
        label = "not ready — CGPA below cutoff"
    return {
        "cgpa": cgpa,
        "cgpa_status": "meets CGPA cutoff" if cgpa >= min_cgpa else "below CGPA cutoff",
        "company": company["name"],
        "match_pct": match_pct,
        "min_cgpa": min_cgpa,
        "missing": missing,
        "readiness": label,
        "role": company["role"],
        "skills_met": met,
    }


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_text(path: Path, contents: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contents, encoding="utf-8")


def emit_genie_assets(
    out_dir: Path,
    students: list[dict[str, object]],
    companies: list[dict[str, object]],
    drives: list[dict[str, object]],
) -> None:
    demo = next(row for row in students if row["student_id"] == usn(1))
    amazon = next(row for row in companies if row["company_id"] == "CMP001")
    google = next(row for row in companies if row["company_id"] == "CMP002")
    ready = readiness_row(demo, amazon)
    google_ready = readiness_row(demo, google)
    eligible = [
        f"{row['name']} {row['role']} (min {row['min_cgpa']})"
        for row in companies
        if float(demo["cgpa"]) >= float(row["min_cgpa"])
    ]
    ineligible = [
        f"{row['name']} {row['role']} (min {row['min_cgpa']})"
        for row in companies
        if float(demo["cgpa"]) < float(row["min_cgpa"])
    ]
    amazon_cutoff = sum(
        1 for row in students if float(row["cgpa"]) >= float(amazon["min_cgpa"])
    )
    band = cgpa_band_for(float(demo["cgpa"]))
    amazon_band = [
        row
        for row in drives
        if row["name"] == "Amazon" and row["cgpa_band"] == band
    ]
    amazon_band_summary = "; ".join(
        f"{row['drive_date']} applicants={row['applicants']} selected={row['selected']}"
        for row in amazon_band
    )
    sys_design_course = next(
        row for row in SKILL_COURSES if row["skill"] == "System Design"
    )

    instructions = f"""# Genie Space instructions (paste into the space)

You are the Placement Readiness Genie for this campus. Answer from Unity Catalog tables in `{TABLE}` only. Do not invent companies, skills, CGPA, or scores.

## Readiness (plain English)

A student is ready for a role if their CGPA is greater than or equal to the role's min_cgpa.

Skill match % = (skills the student has that overlap with required_skills) / (total required_skills).

Treat `students.skills` and `companies.required_skills` as comma-separated lists. Trim whitespace after splitting. Skill names are case-sensitive as stored (DSA, React, System Design, etc.).

CGPA is a hard cutoff. Skill match is reported separately. A student can meet CGPA and still not be fully ready if required skills are missing.

## How to phrase answers

Always name what is met and what is missing. Use the actual skill names from the tables.

Template:
- CGPA: state student CGPA vs the role min_cgpa (met or below).
- Skills met: list them.
- Skills missing: list them. If none, say none missing.
- Skill match %: one number.
- If asked "am I ready", say ready only when CGPA is met AND skill match is 100%. Otherwise say not fully ready and why.

When the user does not pass a student_id, use demo student `1BM25MC001` (CGPA 8.2, skills DSA,React,Python,SQL).

## Tables

- `{TABLE}.students` — student_id, branch, semester, cgpa, skills, backlog_count
- `{TABLE}.companies` — company_id, name, role, job_description, required_skills, min_cgpa, package, visiting_date
- `{TABLE}.student_scores` — student_id, test_type (mock_dsa | aptitude | mock_interview), score, date
- `{TABLE}.skill_courses` — skill, course_or_resource, estimated_duration, difficulty_order
- `{TABLE}.placement_drives` — historical drives by cgpa_band (applicants, shortlisted, selected)
- `{TABLE}.roadmap_progress` — student_id, skill, status (not_started | in_progress | completed), last_updated

CGPA bands for "students like me": 6.0-6.99, 7.0-7.49, 7.5-7.99, 8.0-8.49, 8.5-10.0.
Student 1BM25MC001 (8.2) is band 8.0-8.49.

## Roadmap

If the user asks what to study, join missing skills to `{TABLE}.skill_courses` ordered by difficulty_order. Name the course_or_resource and estimated_duration.

## Demo ground truth (do not contradict)

Amazon SDE Intern (CMP001): min_cgpa 7.5, required DSA,React,System Design.
1BM25MC001 vs Amazon: {ready['cgpa_status']}; skills met {', '.join(ready['skills_met'])}; missing {', '.join(ready['missing'])}; skill match {ready['match_pct']}%; {ready['readiness']}.
1BM25MC001 vs Google SWE Intern: {google_ready['cgpa_status']} (8.2 vs 8.5).
"""

    sql = f"""-- Verified Genie examples. Run these in a SQL warehouse against {TABLE}.
-- Demo student: 1BM25MC001 (CGPA 8.2, skills DSA,React,Python,SQL)

-- ---------------------------------------------------------------------------
-- Q1 phrasing (demo): Am I ready for Amazon's SDE Intern?
-- Also try: Am I ready for Amazon? / Can I sit for Amazon SDE Intern?
-- Expected: {ready['cgpa_status']}; met {', '.join(ready['skills_met'])};
-- missing {', '.join(ready['missing'])}; skill match {ready['match_pct']}%; {ready['readiness']}.
-- ---------------------------------------------------------------------------
WITH me AS (
  SELECT * FROM {TABLE}.students WHERE student_id = '1BM25MC001'
),
role AS (
  SELECT * FROM {TABLE}.companies
  WHERE name = 'Amazon' AND role = 'SDE Intern'
),
parsed AS (
  SELECT
    me.student_id,
    me.cgpa,
    role.name AS company,
    role.role,
    role.min_cgpa,
    filter(transform(split(me.skills, ','), x -> trim(x)), x -> x <> '') AS student_skills,
    filter(transform(split(role.required_skills, ','), x -> trim(x)), x -> x <> '') AS required_skills
  FROM me CROSS JOIN role
)
SELECT
  student_id,
  company,
  role,
  cgpa,
  min_cgpa,
  CASE WHEN cgpa >= min_cgpa THEN 'meets CGPA cutoff' ELSE 'below CGPA cutoff' END AS cgpa_status,
  array_intersect(student_skills, required_skills) AS skills_met,
  array_except(required_skills, student_skills) AS skills_missing,
  ROUND(100.0 * size(array_intersect(student_skills, required_skills)) / size(required_skills), 1) AS skill_match_pct,
  CASE
    WHEN cgpa >= min_cgpa AND size(array_except(required_skills, student_skills)) = 0 THEN 'ready'
    WHEN cgpa >= min_cgpa THEN 'not fully ready — CGPA met, skills incomplete'
    ELSE 'not ready — CGPA below cutoff'
  END AS readiness
FROM parsed;

-- ---------------------------------------------------------------------------
-- Q2 phrasing (demo): What skills am I missing for Amazon?
-- Also try: Skill gaps for Amazon SDE Intern / Which Amazon skills do I lack?
-- Expected missing: {', '.join(ready['missing'])}
-- ---------------------------------------------------------------------------
WITH me AS (
  SELECT * FROM {TABLE}.students WHERE student_id = '1BM25MC001'
),
role AS (
  SELECT * FROM {TABLE}.companies
  WHERE name = 'Amazon' AND role = 'SDE Intern'
)
SELECT
  array_except(
    filter(transform(split(role.required_skills, ','), x -> trim(x)), x -> x <> ''),
    filter(transform(split(me.skills, ','), x -> trim(x)), x -> x <> '')
  ) AS skills_missing,
  sc.skill,
  sc.course_or_resource,
  sc.estimated_duration,
  sc.difficulty_order
FROM me
CROSS JOIN role
JOIN {TABLE}.skill_courses sc
  ON array_contains(
    array_except(
      filter(transform(split(role.required_skills, ','), x -> trim(x)), x -> x <> ''),
      filter(transform(split(me.skills, ','), x -> trim(x)), x -> x <> '')
    ),
    sc.skill
  )
ORDER BY sc.difficulty_order;
-- Roadmap for the gap: {sys_design_course['course_or_resource']} ({sys_design_course['estimated_duration']})

-- ---------------------------------------------------------------------------
-- Q3 phrasing (demo): Which companies can I apply to right now given my CGPA?
-- Also try: Companies whose cutoff I clear / Where does 8.2 CGPA qualify?
-- Expected eligible ({len(eligible)}): {'; '.join(eligible)}
-- Expected ineligible: {'; '.join(ineligible)}
-- ---------------------------------------------------------------------------
SELECT
  c.name,
  c.role,
  c.min_cgpa,
  c.package,
  c.visiting_date
FROM {TABLE}.students s
JOIN {TABLE}.companies c
  ON s.cgpa >= c.min_cgpa
WHERE s.student_id = '1BM25MC001'
ORDER BY c.min_cgpa DESC, c.package DESC;

-- ---------------------------------------------------------------------------
-- Q4 phrasing (demo): How did students with a similar CGPA perform in past drives?
-- Also try: Selection rate for CGPA around 8.2 / How did 8.0-8.49 do at Amazon?
-- Band for 8.2: {band}
-- Amazon in that band: {amazon_band_summary}
-- ---------------------------------------------------------------------------
SELECT
  name,
  role,
  drive_date,
  cgpa_band,
  applicants,
  shortlisted,
  selected,
  ROUND(100.0 * selected / applicants, 1) AS select_rate_pct
FROM {TABLE}.placement_drives
WHERE cgpa_band = '8.0-8.49'
ORDER BY drive_date DESC, name;

-- ---------------------------------------------------------------------------
-- Q5 phrasing (demo): How many students meet Amazon's cutoff?
-- Placement-cell persona. Also try: Count eligible for Amazon SDE Intern / CGPA filter Amazon
-- Expected count: {amazon_cutoff} students with cgpa >= 7.5
-- ---------------------------------------------------------------------------
SELECT
  c.name,
  c.role,
  c.min_cgpa,
  COUNT(*) AS students_meeting_cgpa_cutoff
FROM {TABLE}.students s
JOIN {TABLE}.companies c
  ON s.cgpa >= c.min_cgpa
WHERE c.name = 'Amazon' AND c.role = 'SDE Intern'
GROUP BY c.name, c.role, c.min_cgpa;
"""

    genie_dir = out_dir.parent / "genie"
    write_text(genie_dir / "INSTRUCTIONS.md", instructions)
    write_text(genie_dir / "sample_questions.sql", sql)


def try_write_delta(tables: dict[str, list[dict[str, object]]]) -> None:
    try:
        spark  # type: ignore[name-defined]
    except NameError:
        return

    spark.sql(f"CREATE CATALOG IF NOT EXISTS {CATALOG}")  # type: ignore[name-defined]
    spark.sql(f"CREATE SCHEMA IF NOT EXISTS {TABLE}")  # type: ignore[name-defined]

    def overwrite(table: str, rows: list[dict[str, object]]) -> None:
        frame = spark.createDataFrame(rows)  # type: ignore[name-defined]
        (
            frame.write.format("delta")
            .mode("overwrite")
            .option("overwriteSchema", "true")
            .saveAsTable(f"{TABLE}.{table}")
        )

    for table_name, rows in tables.items():
        overwrite(table_name, rows)
    print(f"Wrote Delta tables to {TABLE}.{{{','.join(tables)}}}")


def main() -> None:
    rng = random.Random(SEED)
    students = build_students(rng)
    scores = build_scores(rng, students)
    companies = COMPANIES
    skill_courses = SKILL_COURSES
    drives = build_placement_drives(rng)
    progress = build_roadmap_progress(rng, students)

    try:
        out_dir = Path(__file__).resolve().parent / "data"
    except NameError:
        out_dir = Path("/tmp/placement_data")

    write_csv(
        out_dir / "students.csv",
        students,
        ["student_id", "branch", "semester", "cgpa", "skills", "backlog_count"],
    )
    write_csv(
        out_dir / "companies.csv",
        companies,
        [
            "company_id",
            "name",
            "role",
            "job_description",
            "required_skills",
            "min_cgpa",
            "package",
            "visiting_date",
        ],
    )
    write_csv(
        out_dir / "student_scores.csv",
        scores,
        ["student_id", "test_type", "score", "date"],
    )
    write_csv(
        out_dir / "skill_courses.csv",
        skill_courses,
        ["skill", "course_or_resource", "estimated_duration", "difficulty_order"],
    )
    write_csv(
        out_dir / "placement_drives.csv",
        drives,
        [
            "drive_id",
            "company_id",
            "name",
            "role",
            "drive_date",
            "cgpa_band",
            "applicants",
            "shortlisted",
            "selected",
        ],
    )
    write_csv(
        out_dir / "roadmap_progress.csv",
        progress,
        ["student_id", "skill", "status", "last_updated"],
    )
    emit_genie_assets(out_dir, students, companies, drives)

    print(
        f"Wrote {len(students)} students, {len(companies)} companies, "
        f"{len(scores)} scores, {len(skill_courses)} skill_courses, "
        f"{len(drives)} placement_drives, {len(progress)} roadmap_progress"
    )
    print(f"CSV folder: {out_dir}")
    print("Genie assets: databricks/genie/INSTRUCTIONS.md + sample_questions.sql")
    print("Demo: 1BM25MC001 vs CMP001 Amazon SDE Intern (CGPA 8.2 vs 7.5, missing System Design)")
    try_write_delta(
        {
            "students": students,
            "companies": companies,
            "student_scores": scores,
            "skill_courses": skill_courses,
            "placement_drives": drives,
            "roadmap_progress": progress,
        }
    )


if __name__ == "__main__":
    main()
