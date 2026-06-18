import { followUpChain } from "../chains/follow-up.chain";
import {
  getInterviewHistory,
  getResumeContext,
  searchKnowledgeBase,
  searchQuestionBank,
} from "../tools";
import type { AgentResponse, InterviewContext } from "../../types/interview";

/**
 * 面试官 Agent — 编排式 Agent（非 ReAct）
 *
 * 模式：代码决定调哪些 Tool → 组装上下文 → 一次性交给 Chain/LLM 决策
 * LLM 不会自己选择 Tool，所有数据由代码并行获取
 */

/**
 * 每次提交回答后调用
 *
 * 流程：Tools 并行收集 → followUpChain → 返回 action + question
 */
export async function invokeInterviewerAgent(
  ctx: InterviewContext,
): Promise<AgentResponse> {
  const ragQuery = `${ctx.lastQuestion ?? ""} ${ctx.lastAnswer ?? ""}`;

  // ── Tools 层：并行获取 Prompt 所需数据 ──
  const [resumeContext, knowledgeHints, historyText] = await Promise.all([
    getResumeContext(ctx.resumeId),
    searchKnowledgeBase(ragQuery, ctx.jobRole),
    getInterviewHistory(ctx.sessionId),
  ]);

  // ── Chain 层：LLM 根据完整上下文做决策 ──
  const response = await followUpChain({
    jobRole: ctx.jobRole,
    resumeSummary: ctx.resumeSummary || resumeContext,
    jobKnowledge: ctx.jobKnowledge,
    knowledgeHints,
    historyText: historyText || ctx.historyText,
    currentRound: ctx.currentRound,
    minRounds: ctx.minRounds,
    maxRounds: ctx.maxRounds,
    lastQuestion: ctx.lastQuestion ?? "",
    lastAnswer: ctx.lastAnswer ?? "",
  });

  return response;
}

/**
 * 首轮出题前调用（由 QuestionGenerateWorkflow 使用）
 *
 * 流程：读简历 + 搜题库 → 返回 Prompt 占位符数据
 */
export async function buildQuestionContext(input: {
  resumeId: string;
  jobRole: string;
  jobKnowledge: string;
}) {
  const { getResumeById } = await import("../../models/Resum");
  const resume = await getResumeById(input.resumeId);
  const parsed = resume?.parsed_data ?? {};
  const ragQuery = `${(parsed.skills ?? []).join(" ")} ${input.jobRole}`;

  const [questionBankHints, knowledgeHints] = await Promise.all([
    searchQuestionBank(ragQuery, input.jobRole),
    searchKnowledgeBase(ragQuery, input.jobRole),
  ]);

  return {
    resumeSummary: parsed.summary ?? "",
    resumeSkills: parsed.skills ?? [],
    jobKnowledge: input.jobKnowledge,
    questionBankHints,
    knowledgeHints,
  };
}
