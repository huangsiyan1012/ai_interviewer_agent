/**
 * 报告 Service
 *
 * AI 路径：ReportService → Evaluator Agent Executor → Tools → 结构化报告
 */
import {
  createReport,
  getReportById,
  getReportBySessionId,
  getReportOwnedByUser,
  getReportsByUserId,
} from "../models/FinalReport";
import { getSessionById, updateSessionGraphState } from "../models/InterviewSession";
import { getCandidateById } from "../models/Candidate";
import { runEvaluatorAgent } from "../langchain/agents/evaluator.agent";
import { SessionMemoryManager } from "../langchain/memory/session.memory";
import type { SessionGraphState } from "../types/api";
import { generateId } from "../utils/uuid";

export class ReportService {
  async generateReport(sessionId: string, userId: string) {
    const session = await getSessionById(sessionId);
    if (!session) throw new Error("面试会话不存在");

    const candidate = await getCandidateById(session.candidate_id);
    if (!candidate || candidate.user_id !== userId) {
      throw new Error("无权访问该会话");
    }

    const existing = await getReportBySessionId(sessionId);
    if (existing) return existing;

    const graphState = (session.graph_state ?? {}) as SessionGraphState;

    const { report, stepLogs } = await runEvaluatorAgent({
      ctx: {
        sessionId,
        resumeId: session.resume_id,
        jobRole: session.job_role,
        jobKnowledge: graphState.jobKnowledge,
      },
    });

    SessionMemoryManager.clear(sessionId);

    const reportId = generateId();
    await createReport(
      reportId,
      sessionId,
      session.candidate_id,
      session.job_role,
      report.overallScore,
      report,
    );

    await updateSessionGraphState(sessionId, {
      ...graphState,
      toolExecutionHistory: [
        ...(graphState.toolExecutionHistory ?? []),
        ...stepLogs,
      ],
    });

    const saved = await getReportById(reportId);
    if (!saved) throw new Error("报告生成失败");
    return saved;
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
