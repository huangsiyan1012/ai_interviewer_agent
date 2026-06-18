// backend/src/models/InterviewSession.ts
import { insert, query, queryOne, update } from "../utils/db";

export interface InterviewSession {
  id: string;
  candidate_id: string;
  resume_id: string;
  job_role: string;
  status: "created" | "in_progress" | "completed";
  current_round: number;
  max_rounds: number;
  graph_state: any;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export const createSession = async (
  id: string,
  candidate_id: string,
  resume_id: string,
  job_role: string,
  max_rounds: number = 5,
): Promise<void> => {
  await insert(
    `INSERT INTO interview_sessions (id, candidate_id, resume_id, job_role, max_rounds) 
     VALUES (?, ?, ?, ?, ?)`,
    [id, candidate_id, resume_id, job_role, max_rounds],
  );
};

export const getSessionById = async (
  id: string,
): Promise<InterviewSession | null> => {
  const row = await queryOne("SELECT * FROM interview_sessions WHERE id = ?", [
    id,
  ]);
  if (row) {
    (row as any).graph_state =
      typeof row.graph_state === "string"
        ? JSON.parse(row.graph_state)
        : row.graph_state;
  }
  return row as InterviewSession | null;
};

export const updateSessionStatus = async (
  id: string,
  status: "created" | "in_progress" | "completed",
  current_round?: number,
): Promise<void> => {
  const fields: string[] = [];
  const values: any[] = [];

  fields.push("status = ?");
  values.push(status);

  if (current_round !== undefined) {
    fields.push("current_round = ?");
    values.push(current_round);
  }

  if (status === "completed") {
    fields.push("completed_at = NOW()");
  }

  values.push(id);
  await update(
    `UPDATE interview_sessions SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
    values,
  );
};

export const getSessionsByCandidateId = async (
  candidateId: string,
): Promise<InterviewSession[]> => {
  return (await query(
    "SELECT * FROM interview_sessions WHERE candidate_id = ? ORDER BY created_at DESC",
    [candidateId],
  )) as InterviewSession[];
};

export const updateSessionGraphState = async (
  id: string,
  graph_state: unknown,
): Promise<void> => {
  await update(
    "UPDATE interview_sessions SET graph_state = ?, updated_at = NOW() WHERE id = ?",
    [JSON.stringify(graph_state), id],
  );
};
