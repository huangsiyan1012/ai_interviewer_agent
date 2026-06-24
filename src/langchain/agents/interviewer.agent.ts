/**
 * 面试官 Agent — 整个面试对话的 AI 大脑
 *
 * 和简历解析 Agent 的区别：
 *   - 简历 Agent 只有 1 个 Tool（parse_resume）
 *   - 面试官 Agent 有 5 个 Tool，Agent 自己决定调哪些、什么顺序
 *
 * 两个任务：
 *   task: "start_interview"  → 开始面试，出第一题
 *   task: "submit_answer"    → 候选人答完后，决定追问/换题/结束
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createAgent, toolCallLimitMiddleware } from "langchain";
import { createDeepSeekModel } from "../../llm";
import config from "../../config/config";
import { getAgentInvokeConfig } from "./agent-config";
import {
  extractAgentStepLogs,
  mergeAgentStepLogs,
} from "./agent-runner";
import {
  InterviewerDecisionSchema,
  type AgentStepLog,
  type InterviewerDecision,
} from "./schemas";
import { INTERVIEWER_AGENT_PROMPT } from "../prompts/agent.prompt";
import { interviewerTools } from "../tools";
import {
  runWithAgentContext,
  type AgentToolContext,
} from "../tools/agent-context";

// ── 创建面试官 Agent（应用启动时执行一次）──
const interviewerAgent = createAgent({
  model: createDeepSeekModel(),
  tools: interviewerTools, // 5 个 Tool：analyze_job / get_resume_context / ...
  systemPrompt: new SystemMessage(INTERVIEWER_AGENT_PROMPT),
  middleware: [
    // 单次最多 6 次 Tool 调用（开始面试大约需要 4 次），防止死循环
    toolCallLimitMiddleware({ runLimit: 6, exitBehavior: "end" }),
  ],
});

/** 调用 Agent 时的入参 */
export interface InterviewerAgentInput {
  ctx: AgentToolContext; // sessionId / resumeId / jobDescription 等
  task: "start_interview" | "submit_answer";
  priorStepLogs?: AgentStepLog[]; // 之前轮次的 Tool 日志（submit_answer 时追加）
  priorMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}

/** Agent 返回给 Service 的结果 */
export interface InterviewerAgentResult {
  decision: InterviewerDecision; // 结构化决策（题目 + action）
  stepLogs: AgentStepLog[];      // 本次 Tool 调用日志
  shouldEnd: boolean;            // 是否该结束面试（结合轮次规则）
}

/**
 * 根据 task 类型，拼装发给 Agent 的用户消息
 * Agent 靠这条消息知道「现在要干什么」
 */
function buildUserMessage(input: InterviewerAgentInput): string {
  const { ctx, task } = input;
  const { minRounds, maxRounds } = config.interview;

  if (task === "start_interview") {
    return [
      "【任务】开始模拟面试，生成第一个问题。",
      `resumeId: ${ctx.resumeId}`,
      `岗位描述:\n${ctx.jobDescription ?? ""}`,
      "",
      "请按顺序各调用 1 次：analyze_job → get_resume_context → retrieve_question_bank → generate_question(purpose=first)",
      "然后输出 JSON 决策（action 用 next_question），不要再调用任何 tool。",
    ].join("\n");
  }

  // submit_answer 任务
  return [
    "【任务】候选人已提交回答，请决定下一步。",
    `sessionId: ${ctx.sessionId}`,
    `当前第 ${ctx.currentRound} 轮（至少 ${minRounds} 轮，最多 ${maxRounds} 轮）`,
    `上一题: ${ctx.lastQuestion ?? ""}`,
    `候选人回答: ${ctx.lastAnswer ?? ""}`,
    "",
    "建议调用：fetch_interview_history → get_resume_context → generate_question(purpose=follow_up 或 next)",
    "然后输出 JSON 决策，不要再调用任何 tool。",
  ].join("\n");
}

/**
 * 运行面试官 Agent — Service 层的唯一 AI 入口
 */
export async function runInterviewerAgent(
  input: InterviewerAgentInput,
): Promise<InterviewerAgentResult> {
  const userContent = buildUserMessage(input);

  // 在 AsyncLocalStorage 挂上上下文，Tool 内部可通过 getAgentContext() 读取
  const result = await runWithAgentContext(input.ctx, async () => {
    return interviewerAgent.invoke(
      { messages: [new HumanMessage(userContent)] },
      getAgentInvokeConfig(),
    );
  });

  // 合并历史日志 + 本次日志
  const stepLogs = mergeAgentStepLogs(
    input.priorStepLogs,
    extractAgentStepLogs(result.messages ?? []),
  );

  // 从 Agent 回复或 generate_question 的 observation 解析决策
  const decision = resolveInterviewerDecision(
    result.messages ?? [],
    stepLogs,
    input.task,
  );

  // ── Service 层的轮次硬规则（Agent 决策之上再套一层保险）──
  const { minRounds, maxRounds } = config.interview;
  const round = input.ctx.currentRound ?? 0;
  const reachedMax = round >= maxRounds; // 达到 12 轮强制结束
  const canLlmEnd = round >= minRounds && decision.action === "end_interview"; // 至少 3 轮才能结束
  const shouldEnd = reachedMax || canLlmEnd;

  if (shouldEnd && decision.action !== "end_interview") {
    decision.action = "end_interview";
    decision.question =
      decision.question ||
      "本次面试问答已全部完成，你可以点击结束面试生成报告。";
  }

  return { decision, stepLogs, shouldEnd };
}

/**
 * 解析 Agent 的最终决策
 * 优先级：Agent 文本 JSON > generate_question 的 observation > 默认兜底
 */
function resolveInterviewerDecision(
  messages: { content?: unknown }[],
  stepLogs: AgentStepLog[],
  task: "start_interview" | "submit_answer",
): InterviewerDecision {
  const fromMessage = parseDecisionFromMessages(messages);
  if (fromMessage) return fromMessage;

  const fromQuestionTool = parseDecisionFromGenerateQuestion(stepLogs, task);
  if (fromQuestionTool) return fromQuestionTool;

  return {
    action: task === "start_interview" ? "next_question" : "follow_up",
    question: "请继续介绍一下你的技术背景和项目经验。",
    questionType: "open",
    difficulty: "easy",
    reasoning: "Agent 未返回结构化决策，使用默认问题",
    targetSkill: "综合",
  };
}

/** 从 Agent 最后几条 AI 消息里抠 JSON */
function parseDecisionFromMessages(
  messages: { content?: unknown }[],
): InterviewerDecision | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const content = messages[i].content;
    if (typeof content !== "string") continue;
    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) continue;
      return InterviewerDecisionSchema.parse(JSON.parse(match[0]));
    } catch {
      /* 继续找上一条 */
    }
  }
  return null;
}

/** 兜底：从 generate_question Tool 的返回里取题目 */
function parseDecisionFromGenerateQuestion(
  logs: AgentStepLog[],
  task: "start_interview" | "submit_answer",
): InterviewerDecision | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (log.action !== "observation" || log.tool !== "generate_question") continue;
    if (!log.output) continue;
    try {
      const q = JSON.parse(log.output) as {
        content?: string;
        questionType?: InterviewerDecision["questionType"];
        difficulty?: InterviewerDecision["difficulty"];
        targetSkill?: string;
      };
      if (!q.content) continue;
      return {
        action: task === "start_interview" ? "next_question" : "follow_up",
        question: q.content,
        questionType: q.questionType ?? "open",
        difficulty: q.difficulty ?? "medium",
        reasoning: "从 generate_question tool 结果解析",
        targetSkill: q.targetSkill ?? "",
      };
    } catch {
      /* continue */
    }
  }
  return null;
}
