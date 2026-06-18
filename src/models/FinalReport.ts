// backend/src/models/FinalReport.ts
import { insert, query, queryOne } from "../utils/db";

export interface FinalReport {
  id: string;
  session_id: string;
  candidate_id: string;
  job_role: string;
  total_score: number;
  report_data: any;
  created_at: Date;
}

export const createReport = async (
  id: string,
  session_id: string,
  candidate_id: string,
  job_role: string,
  total_score: number,
  report_data: any,
): Promise<void> => {
  await insert(
    `INSERT INTO final_reports (id, session_id, candidate_id, job_role, total_score, report_data) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      session_id,
      candidate_id,
      job_role,
      total_score,
      JSON.stringify(report_data),
    ],
  );
};

export const getReportBySessionId = async (
  session_id: string,
): Promise<FinalReport | null> => {
  const row = await queryOne(
    "SELECT * FROM final_reports WHERE session_id = ?",
    [session_id],
  );
  if (row) {
    (row as any).report_data =
      typeof row.report_data === "string"
        ? JSON.parse(row.report_data)
        : row.report_data;
  }
  return row as FinalReport | null;
};

export const getReportById = async (id: string): Promise<FinalReport | null> => {
  const row = await queryOne("SELECT * FROM final_reports WHERE id = ?", [id]);
  if (row) {
    (row as any).report_data =
      typeof row.report_data === "string"
        ? JSON.parse(row.report_data)
        : row.report_data;
  }
  return row as FinalReport | null;
};

export const getReportsByUserId = async (
  userId: string,
): Promise<FinalReport[]> => {
  const rows = await query(
    `SELECT fr.* FROM final_reports fr
     INNER JOIN candidates c ON fr.candidate_id = c.id
     WHERE c.user_id = ?
     ORDER BY fr.created_at DESC`,
    [userId],
  );
  return (rows as any[]).map((row) => ({
    ...row,
    report_data:
      typeof row.report_data === "string"
        ? JSON.parse(row.report_data)
        : row.report_data,
  }));
};

export const getReportOwnedByUser = async (
  reportId: string,
  userId: string,
): Promise<FinalReport | null> => {
  const row = await queryOne(
    `SELECT fr.* FROM final_reports fr
     INNER JOIN candidates c ON fr.candidate_id = c.id
     WHERE fr.id = ? AND c.user_id = ?`,
    [reportId, userId],
  );
  if (!row) return null;
  (row as any).report_data =
    typeof row.report_data === "string"
      ? JSON.parse(row.report_data)
      : row.report_data;
  return row as FinalReport;
};
