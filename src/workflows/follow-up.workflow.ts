import config from "../config/config";
import { invokeInterviewerAgent } from "../langchain/agents/interviewer.agent";
import { SessionMemoryManager } from "../langchain/memory/session.memory";
import type { AgentResponse, InterviewContext } from "../types/interview";
import { BaseWorkflow } from "./base.workflow";

interface FollowUpInput {
  ctx: InterviewContext;
}

interface FollowUpOutput {
  agentResponse: AgentResponse;
  shouldEnd: boolean;
}

/**
 * 追问 Workflow — 面试循环的核心调度
 *
 * 步骤：
 *   1. 把用户回答写入 Memory
 *   2. invokeInterviewerAgent（Agent 调 Tools + Chain）
 *   3. 业务校验：动态轮次（min/max）决定是否结束
 *   4. 若不结束，把 AI 下一题写入 Memory
 *
 * 调用方：InterviewService.submitAnswer
 *
 * 注意：Workflow 负责「业务规则」，Agent 负责「AI 决策」，两者分工明确
 */
export class FollowUpWorkflow extends BaseWorkflow<FollowUpInput, FollowUpOutput> {
  constructor() {
    super("FollowUp");
  }

  protected async run(input: FollowUpInput): Promise<FollowUpOutput> {
    const { ctx } = input;
    const { minRounds, maxRounds } = config.interview;

    SessionMemoryManager.addUser(ctx.sessionId, ctx.lastAnswer ?? "");

    // ── Agent 层：收集上下文 → LLM 决策 ──
    const agentResponse = await invokeInterviewerAgent(ctx);

    // ── 业务规则：B 方案动态轮次 ──
    const reachedMax = ctx.currentRound >= maxRounds; // 达到上限，强制结束
    const llmEnd = agentResponse.action === "end_interview";
    const canLlmEnd = ctx.currentRound >= minRounds && llmEnd; // 至少 min 轮后 LLM 才能结束

    const shouldEnd = reachedMax || canLlmEnd;

    if (!shouldEnd && agentResponse.question) {
      SessionMemoryManager.addAI(ctx.sessionId, agentResponse.question);
    }

    return { agentResponse, shouldEnd };
  }
}

export const followUpWorkflow = new FollowUpWorkflow();
