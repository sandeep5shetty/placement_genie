export type CatalogCompany = {
  company_id: string;
  job_description: string;
  min_cgpa: number;
  name: string;
  package: string;
  required_skills: string[];
  role: string;
  visiting_date: string;
};

export type CatalogStudent = {
  backlog_count: number;
  branch: string;
  cgpa: number;
  semester: number;
  skills: string[];
  student_id: string;
};

export type CatalogScore = {
  date: string;
  score: number;
  student_id: string;
  test_type: string;
};

export type SkillCourse = {
  course_or_resource: string;
  difficulty_order: number;
  estimated_duration: string;
  skill: string;
};
