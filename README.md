# Placement Readiness Genie

Campus placement assistant: students confirm skills (resume or profile), ask whether they are ready for a company and role, and get a sequenced study plan for the gaps.

The chat UI is Next.js + AI SDK. Placement answers are meant to come from a **Databricks Genie** space over campus Delta tables; the roadmap agent maps missing skills to `skill_courses`.

## What it does

- Sign in, then open **Profile** to set CGPA, college, target role, and skills
- Upload a resume (PDF/DOCX) to extract skills and CGPA
- Ask questions such as “Am I ready for Amazon’s SDE Intern?”
- See a readiness score plus a short roadmap for missing skills

## Stack

- Next.js App Router, Auth.js, Neon Postgres (chat history)
- OpenAI via `@ai-sdk/openai` for resume extraction and fallback chat
- Databricks Genie Agent (Conversation API) when `DATABRICKS_*` env vars are set; otherwise a local stub
- Roadmap from `skill_courses` (`lib/placement/roadmap.ts`)

## Run locally

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `OPENAI_API_KEY` | Resume skill/CGPA extraction and chat |
| `POSTGRES_URL` | Neon (or other) Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | Optional — file uploads |
| `REDIS_URL` | Optional — rate limiting |
| `DATABRICKS_HOST` | Workspace URL, no trailing slash |
| `DATABRICKS_TOKEN` | PAT or service principal token |
| `DATABRICKS_GENIE_AGENT_ID` | Genie Agent ID from the agent URL |

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)

Do not commit `.env.local`.

## Databricks data

CSVs for Unity Catalog (`campus.placement`):

| Table | File |
|---|---|
| students | `databricks/data/students.csv` |
| companies | `databricks/data/companies.csv` |
| student_scores | `databricks/data/student_scores.csv` |
| skill_courses | `databricks/data/skill_courses.csv` |
| placement_drives | `databricks/data/placement_drives.csv` |
| roadmap_progress | `databricks/data/roadmap_progress.csv` |

Regenerate:

```bash
python databricks/generate_placement_data.py
```

Demo student: **`1BM25MC001`** (CGPA 8.2, skills DSA, React, Python, SQL) vs Amazon SDE Intern (`CMP001`). Meets CGPA, missing **System Design**.

Genie space copy-paste:

- Instructions: `databricks/genie/INSTRUCTIONS.md`
- Sample questions + SQL: `databricks/genie/sample_questions.sql`

Live phrasing to seed:

- Am I ready for Amazon's SDE Intern?
- What skills am I missing for Amazon?
- Which companies can I apply to right now given my CGPA?
- How did students with a similar CGPA perform in past drives?
- How many students meet Amazon's cutoff?

## Readiness

A student meets the CGPA bar if `cgpa >=` the role’s `min_cgpa`.

Skill match % = (overlapping skills) / (required skills).

Answers should name what is met and what is missing, using the skill names from the tables.
