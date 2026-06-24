/**
 * 面试 Service — 业务编排中心
 *
 * AI 路径：Service → Agent Executor → LLM → Tools → Observation → Loop
 * Service 只负责权限、DB、状态持久化，不直接调用 Chain / Workflow。
 */
import {
  createRecord,
  getRecordsBySessionId,
} from "../models/InterviewRecord";
import {
  createSession,
  getSessionById,
  updateSessionGraphState,
  updateSessionStatus,
} from "../models/InterviewSession";
import { getResumeById } from "../models/Resum";
import { getCandidateById } from "../models/Candidate";
import config from "../config/config";
import { SessionMemoryManager } from "../langchain/memory/session.memory";
import type { SessionGraphState } from "../types/api";
import type { AgentStepLog } from "../langchain/agents/schemas";
import { runInterviewerAgent } from "../langchain/agents/interviewer.agent";
import { generateId } from "../utils/uuid";

const { minRounds, maxRounds } = config.interview;

function restoreMemory(
  sessionId: string,
  messages: SessionGraphState["messages"],
) {
  if (
    SessionMemoryManager.getMessages(sessionId).length === 0 &&
    messages?.length
  ) {
    SessionMemoryManager.init(sessionId, messages);
  }
}

/** 从 Agent tool 日志中提取岗位解析结果 */
function extractJobFromLogs(logs: AgentStepLog[]): {
  jobRole: string;
  jobKnowledge: string;
} {
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (log.action !== "observation" || log.tool !== "analyze_job") continue;
    if (!log.output) continue;
    try {
      const data = JSON.parse(log.output);
      return {
        jobRole: String(data.title ?? "未知岗位"),
        jobKnowledge: String(data.jobKnowledge ?? ""),
      };
    } catch {
      /* try earlier log */
    }
  }
  return { jobRole: "未知岗位", jobKnowledge: "" };
}

export class InterviewService {
  /**
   * 开始面试 — 由 Interviewer Agent 自主调用 tools 完成首题
   */
  async startInterview(resumeId: string, jobDescription: string, userId: string) {
    const resume = await getResumeById(resumeId);
    if (!resume) throw new Error("简历不存在");

    const candidate = await getCandidateById(resume.candidate_id);
    if (!candidate || candidate.user_id !== userId) {
      throw new Error("无权使用该简历");
    }

    const trimmedJob = jobDescription.trim();
    if (!trimmedJob) throw new Error("请填写目标岗位");

    const sessionId = generateId();

    const { decision, stepLogs } = await runInterviewerAgent({
      ctx: {
        sessionId,
        resumeId,
        jobDescription: trimmedJob,
      },
      task: "start_interview",
    });

    const { jobRole, jobKnowledge } = extractJobFromLogs(stepLogs);

    await createSession(
      sessionId,
      resume.candidate_id,
      resumeId,
      jobRole,
      maxRounds,
    );

    SessionMemoryManager.init(sessionId);
    const firstQuestion = decision.question;
    SessionMemoryManager.addAI(sessionId, firstQuestion);

    const graphState: SessionGraphState = {
      jobDescription: trimmedJob,
      jobKnowledge,
      currentQuestion: firstQuestion,
      messages: [{ role: "assistant", content: firstQuestion }],
      agentMemory: [{ role: "assistant", content: firstQuestion }],
      toolExecutionHistory: stepLogs,
    };

    await updateSessionStatus(sessionId, "in_progress", 0);
    await updateSessionGraphState(sessionId, graphState);

    return { sessionId, jobRole, jobKnowledge, firstQuestion };
  }

  async getSession(sessionId: string, userId: string) {
    const session = await getSessionById(sessionId);
    if (!session) throw new Error("面试会话不存在");

    const candidate = await getCandidateById(session.candidate_id);
    if (!candidate || candidate.user_id !== userId) {
      throw new Error("无权访问该会话");
    }

    const records = await getRecordsBySessionId(sessionId);
    const graphState = (session.graph_state ?? {}) as SessionGraphState;
    restoreMemory(sessionId, graphState.messages);

    return {
      session,
      records,
      messages: graphState.messages ?? [],
      currentQuestion: graphState.currentQuestion,
      interviewEnded: graphState.interviewEnded ?? false,
      toolExecutionHistory: graphState.toolExecutionHistory ?? [],
    };
  }

  /**
   * 提交回答 — Interviewer Agent 自主决定追问 / 换题 / 结束
   */
  async submitAnswer(sessionId: string, content: string, userId: string) {
    const session = await getSessionById(sessionId);
    if (!session) throw new Error("面试会话不存在");
    if (session.status === "completed") throw new Error("面试已结束");

    const candidate = await getCandidateById(session.candidate_id);
    if (!candidate || candidate.user_id !== userId) {
      throw new Error("无权访问该会话");
    }

    const graphState = (session.graph_state ?? {}) as SessionGraphState;
    restoreMemory(sessionId, graphState.messages);

    const currentQuestion =
      graphState.currentQuestion ?? "请继续回答上一个问题。";
    const nextRound = session.current_round + 1;

    await createRecord(
      generateId(),
      sessionId,
      nextRound,
      { content: currentQuestion, type: "open" },
      content,
      0,
      null,
    );

    SessionMemoryManager.addUser(sessionId, content);

    const { decision, stepLogs, shouldEnd } = await runInterviewerAgent({
      ctx: {
        sessionId,
        resumeId: session.resume_id,
        jobRole: session.job_role,
        jobDescription: graphState.jobDescription,
        jobKnowledge: graphState.jobKnowledge,
        currentRound: nextRound,
        minRounds,
        maxRounds: session.max_rounds,
        lastQuestion: currentQuestion,
        lastAnswer: content,
      },
      task: "submit_answer",
      priorStepLogs: graphState.toolExecutionHistory,
    });

    const messages = [
      ...(graphState.messages ?? []),
      { role: "user" as const, content },
    ];

    let action: "follow_up" | "next_question" | "end_interview" = "follow_up";
    let nextQuestion: string | undefined;

    if (shouldEnd) {
      action = "end_interview";
    } else {
      nextQuestion = decision.question;
      messages.push({ role: "assistant", content: nextQuestion });
      SessionMemoryManager.addAI(sessionId, nextQuestion);
      action =
        decision.action === "follow_up" ? "follow_up" : "next_question";
    }

    await updateSessionStatus(sessionId, "in_progress", nextRound);
    await updateSessionGraphState(sessionId, {
      ...graphState,
      currentQuestion: nextQuestion,
      messages,
      agentMemory: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      toolExecutionHistory: stepLogs,
      interviewEnded: shouldEnd,
    });

    return { action, question: nextQuestion, round: nextRound, messages };
  }

  async finishInterview(sessionId: string, userId: string) {
    const session = await getSessionById(sessionId);
    if (!session) throw new Error("面试会话不存在");

    const candidate = await getCandidateById(session.candidate_id);
    if (!candidate || candidate.user_id !== userId) {
      throw new Error("无权访问该会话");
    }

    await updateSessionStatus(sessionId, "completed", session.current_round);

    const { reportService } = await import("./report.service");
    const report = await reportService.generateReport(sessionId, userId);

    return { reportId: report.id, sessionId };
  }
}

export const interviewService = new InterviewService();
