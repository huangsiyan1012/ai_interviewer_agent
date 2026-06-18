/**
 * 报告 Service
 *
 * 职责：权限校验 → 调 EvaluationWorkflow 生成报告 → 存 DB
 * 调用链：InterviewService.finishInterview → ReportService → EvaluationWorkflow → EvaluatorAgent
 */
import {
  createReport,
  getReportById,
  getReportBySessionId,
  getReportOwnedByUser,
  getReportsByUserId,
} from "../models/FinalReport";
import { getSessionById } from "../models/InterviewSession";
import { getCandidateById } from "../models/Candidate";
import { evaluationWorkflow } from "../workflows/evaluation.workflow";
import { generateId } from "../utils/uuid";

export class ReportService {
  async generateReport(sessionId: string, userId: string) {
    const session = await getSessionById(sessionId);
    if (!session) throw new Error("面试会话不存在");

    const candidate = await getCandidateById(session.candidate_id);
    if (!candidate || candidate.user_id !== userId) {
      throw new Error("无权访问该会话");
    }

    // 幂等：同一会话不重复生成
    const existing = await getReportBySessionId(sessionId);
    if (existing) return existing;

    // ── AI：EvaluationWorkflow → EvaluatorAgent → evaluationChain ──
    const reportData = await evaluationWorkflow.execute({
      sessionId,
      jobRole: session.job_role,
    });

    const reportId = generateId();
    await createReport(
      reportId,
      sessionId,
      session.candidate_id,
      session.job_role,
      reportData.overallScore,
      reportData,
    );

    const report = await getReportById(reportId);
    if (!report) throw new Error("报告生成失败");
    return report;
  }

  async getReport(id: string, userId: string) {
    const report = await getReportOwnedByUser(id, userId);
    if (!report) throw new Error("报告不存在或无权访问");
    return report;
  }

  async getReportBySession(sessionId: string, userId: string) {
    const session = await getSessionById(sessionId);
    if (!session) throw new Error("面试会话不存在");

    const candidate = await getCandidateById(session.candidate_id);
    if (!candidate || candidate.user_id !== userId) {
      throw new Error("无权访问该报告");
    }

    const report = await getReportBySessionId(sessionId);
    if (!report) throw new Error("报告不存在");
    return report;
  }

  async listMyReports(userId: string) {
    const reports = await getReportsByUserId(userId);
    return reports.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      jobRole: r.job_role,
      totalScore: r.total_score,
      grade: r.report_data?.grade ?? "",
      createdAt: r.created_at,
    }));
  }
}

export const reportService = new ReportService();
