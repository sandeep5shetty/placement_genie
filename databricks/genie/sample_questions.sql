-- Verified Genie examples. Run these in a SQL warehouse against campus.placement.
-- Demo student: 1BM25MC001 (CGPA 8.2, skills DSA,React,Python,SQL)

-- ---------------------------------------------------------------------------
-- Q1 phrasing (demo): Am I ready for Amazon's SDE Intern?
-- Also try: Am I ready for Amazon? / Can I sit for Amazon SDE Intern?
-- Expected: meets CGPA cutoff; met DSA, React;
-- missing System Design; skill match 66.7%; not fully ready — CGPA met, skills incomplete.
-- ---------------------------------------------------------------------------
WITH me AS (
  SELECT * FROM campus.placement.students WHERE student_id = '1BM25MC001'
),
role AS (
  SELECT * FROM campus.placement.companies
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
-- Expected missing: System Design
-- ---------------------------------------------------------------------------
WITH me AS (
  SELECT * FROM campus.placement.students WHERE student_id = '1BM25MC001'
),
role AS (
  SELECT * FROM campus.placement.companies
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
JOIN campus.placement.skill_courses sc
  ON array_contains(
    array_except(
      filter(transform(split(role.required_skills, ','), x -> trim(x)), x -> x <> ''),
      filter(transform(split(me.skills, ','), x -> trim(x)), x -> x <> '')
    ),
    sc.skill
  )
ORDER BY sc.difficulty_order;
-- Roadmap for the gap: Grokking System Design — URL shortener, news feed, chat (2 weeks)

-- ---------------------------------------------------------------------------
-- Q3 phrasing (demo): Which companies can I apply to right now given my CGPA?
-- Also try: Companies whose cutoff I clear / Where does 8.2 CGPA qualify?
-- Expected eligible (29): Amazon SDE Intern (min 7.5); Microsoft SDE Intern (min 8.0); Honeywell Software Engineer Intern (min 7.0); TCS Ninja (min 6.0); Infosys Systems Engineer (min 6.5); Wipro Project Engineer (min 6.5); Accenture Associate Software Engineer (min 6.5); Cognizant GenC (min 6.5); Capgemini Analyst (min 6.5); IBM Application Developer (min 6.5); HCLTech Graduate Engineer Trainee (min 6.5); Deloitte Analyst (min 7.0); Adobe SDE Intern (min 8.0); Cisco Software Engineer Intern (min 7.5); Oracle Applications Engineer (min 7.0); SAP Associate Developer (min 7.0); Salesforce SDE Intern (min 7.5); Bosch Software Intern (min 7.0); Qualcomm Software Engineer Intern (min 7.5); Intel Software Engineer Intern (min 7.5); Zoho SDE (min 7.0); Freshworks SDE Intern (min 7.0); Flipkart SDE Intern (min 7.5); Walmart Global Tech SDE Intern (min 7.5); PhonePe SDE Intern (min 7.5); Goldman Sachs Summer Analyst (min 8.0); JPMorgan Chase Software Engineer Intern (min 7.5); Intuit SDE Intern (min 7.5); Databricks Data Engineer Intern (min 8.0)
-- Expected ineligible: Google SWE Intern (min 8.5)
-- ---------------------------------------------------------------------------
SELECT
  c.name,
  c.role,
  c.min_cgpa,
  c.package,
  c.visiting_date
FROM campus.placement.students s
JOIN campus.placement.companies c
  ON s.cgpa >= c.min_cgpa
WHERE s.student_id = '1BM25MC001'
ORDER BY c.min_cgpa DESC, c.package DESC;

-- ---------------------------------------------------------------------------
-- Q4 phrasing (demo): How did students with a similar CGPA perform in past drives?
-- Also try: Selection rate for CGPA around 8.2 / How did 8.0-8.49 do at Amazon?
-- Band for 8.2: 8.0-8.49
-- Amazon in that band: 2024-10-15 applicants=20 selected=3; 2025-10-08 applicants=19 selected=3
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
FROM campus.placement.placement_drives
WHERE cgpa_band = '8.0-8.49'
ORDER BY drive_date DESC, name;

-- ---------------------------------------------------------------------------
-- Q5 phrasing (demo): How many students meet Amazon's cutoff?
-- Placement-cell persona. Also try: Count eligible for Amazon SDE Intern / CGPA filter Amazon
-- Expected count: 77 students with cgpa >= 7.5
-- ---------------------------------------------------------------------------
SELECT
  c.name,
  c.role,
  c.min_cgpa,
  COUNT(*) AS students_meeting_cgpa_cutoff
FROM campus.placement.students s
JOIN campus.placement.companies c
  ON s.cgpa >= c.min_cgpa
WHERE c.name = 'Amazon' AND c.role = 'SDE Intern'
GROUP BY c.name, c.role, c.min_cgpa;
