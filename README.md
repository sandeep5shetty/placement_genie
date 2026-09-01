# Placement Readiness Genie

AI-powered campus placement platform with two separate modules:

- **PLO Module** — Placement Intelligence for Placement Officers and placement teams
- **Student Module** — Placement Readiness Genie for individual students

The platform uses **Databricks Genie** and campus placement data to provide placement analytics at the institutional level and personalized readiness analysis at the student level.

---

## Modules

### 1. PLO — Placement Intelligence

The PLO module is designed for Placement Officers and placement teams.

It helps analyze campus placement performance, recruitment drives, skill gaps, student assessment trends, and learning progress.

Users can ask natural-language questions and receive:

- Placement performance insights
- Recruitment funnel analysis
- Applicant, shortlisted, and selected metrics
- Conversion rates and drop-off analysis
- Company and role-wise comparisons
- Skill gap insights
- Assessment performance trends
- Roadmap completion analysis
- Intervention recommendations
- Interactive charts and visualizations

Example questions:

- What is the overall placement performance?
- Analyze the placement recruitment funnel across all drives.
- Which drives have the worst shortlist-to-selection conversion?
- Identify the highest-impact skill gaps.
- What intervention areas should the placement team prioritize?

The PLO module uses a **Databricks Genie Agent** connected to campus placement Delta tables.

---

### 2. Student — Placement Readiness Genie

The Student module is designed for individual students.

Students can confirm their skills using their profile or resume, ask whether they are ready for a company and role, and receive a sequenced study plan for missing skills.

Example:

> Am I ready for Amazon's SDE Intern role?

The system compares the student's profile with company requirements and identifies:

- CGPA eligibility
- Matching skills
- Missing skills
- Skill match percentage
- Placement readiness
- Recommended study roadmap

The roadmap maps missing skills to available courses from `skill_courses`.

---

## What it does

### PLO Module

- Analyze overall placement performance
- Track applicants, shortlisted candidates, and selected candidates
- Calculate recruitment conversion rates
- Identify placement funnel bottlenecks
- Compare company and role-wise recruitment performance
- Analyze student assessment performance
- Identify institution-level skill gaps
- Track roadmap and skill development progress
- Generate data-driven recommendations
- Display interactive charts and visualizations from Genie query results

### Student Module

- Sign in and create a student profile
- Set CGPA, college, target role, and skills
- Upload a resume (PDF/DOCX) to extract skills and CGPA
- Ask whether they are ready for a company and role
- Compare student skills with company requirements
- Identify missing skills
- Check CGPA eligibility
- Generate a readiness result
- Receive a sequenced study roadmap for skill gaps

---

## Stack

- Next.js App Router
- TypeScript
- Auth.js
- Neon Postgres (chat history)
- OpenAI via `@ai-sdk/openai` for resume extraction and fallback chat
- Databricks Genie Agent using Conversation API
- Databricks Unity Catalog / Delta Tables
- Recharts for analytics visualizations
- Roadmap generation from `skill_courses`

---

## Run locally

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `OPENAI_API_KEY` | Resume skill/CGPA extraction and fallback chat |
| `POSTGRES_URL` | Neon (or other) Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | Optional — file uploads |
| `REDIS_URL` | Optional — rate limiting |
| `DATABRICKS_HOST` | Workspace URL, no trailing slash |
| `DATABRICKS_TOKEN` | PAT or service principal token |
| `DATABRICKS_GENIE_AGENT_ID` | Genie Agent ID |

```bash
pnpm install
pnpm db:migrate
pnpm dev   
