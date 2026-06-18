import { query, queryOne } from "../utils/db";

export interface Job {
  id: string;
  title: string;
  category: string;
  jd_text: string | null;
  created_at: Date;
}

export const getAllJobs = async (): Promise<Job[]> => {
  return (await query("SELECT * FROM jobs ORDER BY created_at ASC")) as Job[];
};

export const getJobById = async (id: string): Promise<Job | null> => {
  return (await queryOne("SELECT * FROM jobs WHERE id = ?", [id])) as Job | null;
};

export const getJobByTitle = async (title: string): Promise<Job | null> => {
  return (await queryOne("SELECT * FROM jobs WHERE title = ?", [title])) as Job | null;
};
