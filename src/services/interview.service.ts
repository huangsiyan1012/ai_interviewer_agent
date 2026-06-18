/**
 * 面试 Service — 业务编排中心
 *
 * 职责：
 * 1. 权限校验（用户是否拥有该简历/会话）
 * 2. 读写数据库（session、QA 记录、graph_state）
 * 3. 调用 Workflow / Chain 完成 AI 逻辑
 * 4. 把 AI 结果落库并返回给 Controller
 *
 * 调用链：Controller → Service → Workflow → Agent → Chain → LLM
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
import { analyzeJobChain } from "../langchain/chains/job-analyze.chain";
import config from "../config/config";
import { SessionMemoryManager } from "../langchain/memory/session.memory";
import { formatJobKnowledge } from "../types/job";
import type { SessionGraphState } from "../types/api";
import { followUpWorkflow } from "../workflows/follow-up.workflow";
import { questionGenerateWorkflow } from "../workflows/question-generate.workflow";
import { sessionInitWorkflow } from "../workflows/session-init.workflow";
import { generateId } from "../utils/uuid";

const { minRounds, maxRounds } = config.interview;

/** 服务重启或页面刷新时，从 DB 恢复内存中的对话缓存 */
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

export class InterviewService {
  /**
   * 【流程 1】开始面试
   *
   * Service 层步骤：
   *   权限校验 → LLM 解析岗位 → 建 session → 调 2 个 Workflow → 写 graph_state
   *
   * AI 调用：
   *   analyzeJobChain（岗位分析，直接调 Chain，不经过 Workflow）
   *   sessionInitWorkflow（初始化 Memory）
   *   questionGenerateWorkflow（首轮出题）
   */
  async startInterview(resumeId: string, jobDescription: string, userId: string) {
    // ── 1. 业务校验 ──
    const resume = await getResumeById(resumeId);
    if (!resume) throw new Error("简历不存在");

    const candidate = await getCandidateById(resume.candidate_id);
    if (!candidate || candidate.user_id !== userId) {
      throw new Error("无权使用该简历");
    }

    const trimmedJob = jobDescription.trim();
    if (!trimmedJob) throw new Error("请填写目标岗位");

    // ── 2. AI：解析用户填写的岗位（Chain，非 Workflow）──
    const parsedJob = await analyzeJobChain(trimmedJob);
    const jobRole = parsedJob.title;
    const jobKnowledge = formatJobKnowledge(parsedJob);

    // ── 3. 创建面试会话（DB）──
    const sessionId = generateId();
    await createSession(
      sessionId,
      resume.candidate_id,
      resumeId,
      jobRole,
      maxRounds, // 安全上限，实际轮次由 LLM 动态决定
    );

    // ── 4. Workflow：初始化 Memory ──
    await sessionInitWorkflow.execute({ sessionId, resumeId, jobRole });

    // ── 5. Workflow：收集上下文 + 生成第一题 ──
    const question = await questionGenerateWorkflow.execute({
      sessionId,
      resumeId,
      jobRole,
      jobKnowledge,
    });

    // ── 6. 持久化会话快照（graph_state 供前端刷新恢复）──
    const firstQuestion = question.content;
    const graphState: SessionGraphState = {
      jobDescription: trimmedJob,
      jobKnowledge, // 追问时直接读，避免重复调 LLM
      currentQuestion: firstQuestion,
      messages: [{ role: "assistant", content: firstQuestion }],
    };

    await updateSessionStatus(sessionId, "in_progress", 0);
    await updateSessionGraphState(sessionId, graphState);

    return { sessionId, jobRole, jobKnowledge, firstQuestion };
  }

  /** 【流程 2】获取会话（页面刷新时恢复对话） */
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
    };
  }

  /**
   * 【流程 3】提交回答 — 最核心的循环
   *
   * Service 层步骤：
   *   读 session → 存 QA 记录 → 调 FollowUpWorkflow → 更新 graph_state
   *
   * AI 调用：
   *   followUpWorkflow → invokeInterviewerAgent → followUpChain
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
    const resume = await getResumeById(session.resume_id);

    // ── 1. 持久化本轮 Q&A 到 interview_records 表 ──
    await createRecord(
      generateId(),
      sessionId,
      nextRound,
      { content: currentQuestion, type: "open" },
      content,
      0,
      null,
    );

    const messages = [
      ...(graphState.messages ?? []),
      { role: "user" as const, content },
    ];

    // ── 2. 调 Workflow：Agent 决策下一题或结束 ──
    const { agentResponse, shouldEnd } = await followUpWorkflow.execute({
      ctx: {
        sessionId,
        resumeId: session.resume_id,
        jobId: "",
        jobRole: session.job_role,
        resumeSummary: resume?.parsed_data?.summary ?? "",
        resumeSkills: resume?.parsed_data?.skills ?? [],
        jobKnowledge: graphState.jobKnowledge ?? "", // 从 graph_state 读，不重复解析
        questionBankHints: "",
        historyText: SessionMemoryManager.toText(sessionId),
        currentRound: nextRound,
        minRounds,
        maxRounds: session.max_rounds,
        lastAnswer: content,
        lastQuestion: currentQuestion,
      },
    });

    // ── 3. 根据 Workflow 返回的 shouldEnd 决定前端行为 ──
    let action: "follow_up" | "next_question" | "end_interview" = "follow_up";
    let nextQuestion: string | undefined;

    if (shouldEnd) {
      action = "end_interview";
    } else {
      nextQuestion = agentResponse.question;
      messages.push({ role: "assistant", content: nextQuestion });
      action =
        agentResponse.action === "follow_up" ? "follow_up" : "next_question";
    }

    // ── 4. 更新 DB 状态 ──
    await updateSessionStatus(sessionId, "in_progress", nextRound);
    await updateSessionGraphState(sessionId, {
      ...graphState,
      currentQuestion: nextQuestion,
      messages,
      interviewEnded: shouldEnd,
    });

    return { action, question: nextQuestion, round: nextRound, messages };
  }

  /**
   * 【流程 4】结束面试 → 生成报告
   *
   * AI 调用：reportService → evaluationWorkflow → invokeEvaluatorAgent
   */
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
