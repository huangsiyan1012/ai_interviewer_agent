/**
 * 面试官 Agent — Tool-calling ReAct Agent
 *
 * 不使用 toolStrategy 结构化输出（DeepSeek 易陷入重复调用），
 * 决策 JSON 从 Agent 最终回复或 generate_question 的 observation 解析。
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

const interviewerAgent = createAgent({
  model: createDeepSeekModel(),
  tools: interviewerTools,
  systemPrompt: new SystemMessage(INTERVIEWER_AGENT_PROMPT),
  middleware: [
    // 单次运行最多 6 次 tool call，超出后强制结束，防止死循环
    toolCallLimitMiddleware({ runLimit: 6, exitBehavior: "end" }),
  ],
});

export interface InterviewerAgentInput {
  ctx: AgentToolContext;
  task: "start_interview" | "submit_answer";
  priorStepLogs?: AgentStepLog[];
  priorMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface InterviewerAgentResult {
  decision: InterviewerDecision;
  stepLogs: AgentStepLog[];
  shouldEnd: boolean;
}

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

/** 运行面试官 Agent Loop，返回结构化决策与 tool 执行日志 */
export async function runInterviewerAgent(
  input: InterviewerAgentInput,
): Promise<InterviewerAgentResult> {
  const userContent = buildUserMessage(input);

  const result = await runWithAgentContext(input.ctx, async () => {
    return interviewerAgent.invoke(
      { messages: [new HumanMessage(userContent)] },
      getAgentInvokeConfig(),
    );
  });

  const stepLogs = mergeAgentStepLogs(
    input.priorStepLogs,
    extractAgentStepLogs(result.messages ?? []),
  );

  const decision = resolveInterviewerDecision(
    result.messages ?? [],
    stepLogs,
    input.task,
  );

  const { minRounds, maxRounds } = config.interview;
  const round = input.ctx.currentRound ?? 0;
  const reachedMax = round >= maxRounds;
  const canLlmEnd = round >= minRounds && decision.action === "end_interview";
  const shouldEnd = reachedMax || canLlmEnd;

  if (shouldEnd && decision.action !== "end_interview") {
    decision.action = "end_interview";
    decision.question =
      decision.question ||
      "本次面试问答已全部完成，你可以点击结束面试生成报告。";
  }

  return { decision, stepLogs, shouldEnd };
}

/** 从 Agent 最终回复或 generate_question 结果解析决策 */
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
      /* try earlier message */
    }
  }
  return null;
}

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
