/**
 * 评估师 Agent — Tool-calling ReAct Agent
 *
 * 最终报告从 evaluate_answer tool 的 observation 解析，避免 toolStrategy 死循环。
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createAgent, toolCallLimitMiddleware } from "langchain";
import { createPreciseModel } from "../../llm";
import { getAgentInvokeConfig } from "./agent-config";
import { extractAgentStepLogs } from "./agent-runner";
import {
  EvaluationReportSchema,
  type AgentStepLog,
} from "./schemas";
import type { EvaluationReportData } from "../../types/interview";
import { EVALUATOR_AGENT_PROMPT } from "../prompts/agent.prompt";
import { evaluatorTools } from "../tools";
import {
  runWithAgentContext,
  type AgentToolContext,
} from "../tools/agent-context";

const evaluatorAgent = createAgent({
  model: createPreciseModel(),
  tools: evaluatorTools,
  systemPrompt: new SystemMessage(EVALUATOR_AGENT_PROMPT),
  middleware: [
    toolCallLimitMiddleware({ runLimit: 4, exitBehavior: "end" }),
  ],
});

export interface EvaluatorAgentInput {
  ctx: AgentToolContext;
}

export interface EvaluatorAgentResult {
  report: EvaluationReportData;
  stepLogs: AgentStepLog[];
}

/** 运行评估师 Agent Loop */
export async function runEvaluatorAgent(
  input: EvaluatorAgentInput,
): Promise<EvaluatorAgentResult> {
  const userContent = [
    "【任务】对本次模拟面试生成完整评估报告。",
    `sessionId: ${input.ctx.sessionId}`,
    `岗位: ${input.ctx.jobRole ?? ""}`,
    "各 tool 最多调用 1 次：fetch_interview_history → evaluate_answer，完成后停止。",
  ].join("\n");

  const result = await runWithAgentContext(input.ctx, async () => {
    return evaluatorAgent.invoke(
      { messages: [new HumanMessage(userContent)] },
      getAgentInvokeConfig(),
    );
  });

  const stepLogs = extractAgentStepLogs(result.messages ?? []);

  const report = parseReportFromObservations(stepLogs);

  return { report, stepLogs };
}

function parseReportFromObservations(
  logs: AgentStepLog[],
): EvaluationReportData {
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (log.action !== "observation" || log.tool !== "evaluate_answer") continue;
    if (!log.output) continue;
    try {
      return EvaluationReportSchema.parse(JSON.parse(log.output));
    } catch {
      /* continue */
    }
  }

  return {
    overallScore: 70,
    grade: "B",
    dimensions: [],
    strengths: [],
    weaknesses: [],
    suggestions: [],
    summary: "评估 Agent 未能生成完整报告",
  };
}
