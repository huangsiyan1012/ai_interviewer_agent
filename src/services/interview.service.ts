/**
 * 面试 Service — 业务编排中心
 *
 * 【开始面试】完整路径：
 *   startInterview
 *     → runInterviewerAgent(task: "start_interview")
 *         → Interviewer Agent 自主调用 4 个 Tool
 *     → extractJobFromLogs（从 Tool 日志取岗位名）
 *     → createSession + 写 graph_state
 *
 * Service 不直接调 LLM，所有 AI 决策交给 Interviewer Agent。
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

/** 页面刷新时，把 DB 里的 messages 恢复到内存缓存 */
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

/**
 * 从 Agent 的 tool 执行日志里提取岗位信息
 *
 * 开始面试时，岗位是 Agent 调用 analyze_job Tool 解析出来的，
 * 结果存在 stepLogs 的 observation 里，Service 从这里读出来写 DB。
 */
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
      /* 解析失败则继续找上一条 */
    }
  }
  return { jobRole: "未知岗位", jobKnowledge: "" };
}

export class InterviewService {
  /**
   * 【流程 1】开始面试
   *
   * 输入：resumeId（上一步上传简历得到）+ jobDescription（用户填的岗位）
   * 输出：sessionId + 第一道题
   */
  async startInterview(resumeId: string, jobDescription: string, userId: string) {
    // ── 第 1 步：权限校验 ──
    const resume = await getResumeById(resumeId);
    if (!resume) throw new Error("简历不存在");

    const candidate = await getCandidateById(resume.candidate_id);
    if (!candidate || candidate.user_id !== userId) {
      throw new Error("无权使用该简历"); // 不能用别人的简历
    }

    const trimmedJob = jobDescription.trim();
    if (!trimmedJob) throw new Error("请填写目标岗位");

    // ── 第 2 步：预生成 sessionId（Agent 上下文需要）──
    const sessionId = generateId();

    // ── 第 3 步：调用 Interviewer Agent，生成第一题 ──
    // Agent 会自主决定调用：analyze_job → get_resume_context
    //   → retrieve_question_bank → generate_question
    const { decision, stepLogs } = await runInterviewerAgent({
      ctx: {
        sessionId,
        resumeId,
        jobDescription: trimmedJob,
      },
      task: "start_interview", // 告诉 Agent 这是「开始面试」任务
    });

    // ── 第 4 步：从 Agent 日志里提取岗位名（analyze_job 的结果）──
    const { jobRole, jobKnowledge } = extractJobFromLogs(stepLogs);

    // ── 第 5 步：创建面试会话记录 ──
    await createSession(
      sessionId,
      resume.candidate_id,
      resumeId,
      jobRole,
      maxRounds, // 安全上限 12 轮，实际结束由 Agent + minRounds 决定
    );

    // ── 第 6 步：初始化内存对话缓存 ──
    SessionMemoryManager.init(sessionId);
    const firstQuestion = decision.question; // Agent 决策里的题目
    SessionMemoryManager.addAI(sessionId, firstQuestion);

    // ── 第 7 步：写入 graph_state（会话状态快照，刷新页面可恢复）──
    const graphState: SessionGraphState = {
      jobDescription: trimmedJob,       // 原始岗位描述
      jobKnowledge,                     // 解析后的 JD 要点（追问时复用，不再调 analyze_job）
      currentQuestion: firstQuestion,   // 当前要问的问题
      messages: [{ role: "assistant", content: firstQuestion }],
      agentMemory: [{ role: "assistant", content: firstQuestion }],
      toolExecutionHistory: stepLogs,   // Agent 调了哪些 Tool，完整记录
    };

    await updateSessionStatus(sessionId, "in_progress", 0);
    await updateSessionGraphState(sessionId, graphState);

    return { sessionId, jobRole, jobKnowledge, firstQuestion };
  }

  /** 【流程 2】获取会话（页面刷新恢复） */
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
   * 【流程 3】提交回答 — 面试循环的核心
   *
   * 每提交一次回答：
   *   存 QA 记录 → 调 Interviewer Agent → 更新 graph_state → 返回下一题或结束
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

    // 持久化本轮 Q&A 到 interview_records 表
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

    // 调 Interviewer Agent 决定：追问 / 换题 / 结束
    const { decision, stepLogs, shouldEnd } = await runInterviewerAgent({
      ctx: {
        sessionId,
        resumeId: session.resume_id,
        jobRole: session.job_role,
        jobDescription: graphState.jobDescription,
        jobKnowledge: graphState.jobKnowledge, // 从 graph_state 读，不重复解析岗位
        currentRound: nextRound,
        minRounds,
        maxRounds: session.max_rounds,
        lastQuestion: currentQuestion,
        lastAnswer: content,
      },
      task: "submit_answer",
      priorStepLogs: graphState.toolExecutionHistory, // 追加到历史日志
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

  /** 【流程 4】结束面试 → 触发 Evaluator Agent 生成报告 */
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
