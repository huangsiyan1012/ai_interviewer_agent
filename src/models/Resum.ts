// backend/src/models/Resume.ts
import { insert, query, queryOne } from "../utils/db.js";

export interface Resume {
  id: string;
  candidate_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  parsed_data: any;
  created_at: Date;
}

export const createResume = async (
  id: string,
  candidate_id: string,
  file_path: string,
  file_name: string,
  mime_type: string,
  parsed_data?: any,
): Promise<void> => {
  await insert(
    `INSERT INTO resumes (id, candidate_id, file_path, file_name, mime_type, parsed_data) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      candidate_id,
      file_path,
      file_name,
      mime_type,
      parsed_data ? JSON.stringify(parsed_data) : null,
    ],
  );
};

export const getResumeById = async (id: string): Promise<Resume | null> => {
  const row = await queryOne("SELECT * FROM resumes WHERE id = ?", [id]);
  if (row) {
    (row as any).parsed_data =
      typeof row.parsed_data === "string"
        ? JSON.parse(row.parsed_data)
        : row.parsed_data;
  }
  return row as Resume | null;
};

export const getResumesByCandidateId = async (
  candidateId: string,
): Promise<Resume[]> => {
  const rows = await query(
    "SELECT * FROM resumes WHERE candidate_id = ? ORDER BY created_at DESC",
    [candidateId],
  );
  return (rows as any[]).map((row) => ({
    ...row,
    parsed_data:
      typeof row.parsed_data === "string"
        ? JSON.parse(row.parsed_data)
        : row.parsed_data,
  }));
};
