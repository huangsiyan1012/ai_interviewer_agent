// backend/src/models/Candidate.ts
import { insert, query, queryOne } from "../utils/db";

export interface Candidate {
  id: string;
  user_id: string | null;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

export const createCandidate = async (
  id: string,
  userId?: string,
  name?: string,
): Promise<void> => {
  await insert(
    "INSERT INTO candidates (id, user_id, name) VALUES (?, ?, ?)",
    [id, userId || null, name || null],
  );
};

export const getCandidateById = async (
  id: string,
): Promise<Candidate | null> => {
  return await queryOne("SELECT * FROM candidates WHERE id = ?", [id]);
};

export const getAllCandidates = async (): Promise<Candidate[]> => {
  return (await query(
    "SELECT * FROM candidates ORDER BY created_at DESC",
  )) as Candidate[];
};
