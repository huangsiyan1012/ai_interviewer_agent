// backend/src/models/InterviewRecord.ts
import { insert, query } from "../utils/db";

export interface InterviewRecord {
  id: string;
  session_id: string;
  round_num: number;
  question: any;
  answer: string;
  score: number;
  score_detail: any;
  created_at: Date;
}

export const createRecord = async (
  id: string,
  session_id: string,
  round_num: number,
  question: any,
  answer: string,
  score: number,
  score_detail: any,
): Promise<void> => {
  await insert(
    `INSERT INTO interview_records (id, session_id, round_num, question, answer, score, score_detail) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      session_id,
      round_num,
      JSON.stringify(question),
      answer,
      score,
      JSON.stringify(score_detail),
    ],
  );
};

export const getRecordsBySessionId = async (
  session_id: string,
): Promise<InterviewRecord[]> => {
  const rows = await query(
    "SELECT * FROM interview_records WHERE session_id = ? ORDER BY round_num ASC",
    [session_id],
  );
  return (rows as any[]).map((row) => ({
    ...row,
    question:
      typeof row.question === "string"
        ? JSON.parse(row.question)
        : row.question,
    score_detail:
      typeof row.score_detail === "string"
        ? JSON.parse(row.score_detail)
        : row.score_detail,
  }));
};
