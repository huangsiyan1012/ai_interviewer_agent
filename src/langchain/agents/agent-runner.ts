/**
 * Agent 执行日志提取
 *
 * Agent invoke 返回的 messages 是一条「对话链」，包含：
 *   HumanMessage  → 用户任务
 *   AIMessage     → LLM 回复（可能含 tool_calls）
 *   ToolMessage   → Tool 执行结果（observation）
 *   AIMessage     → LLM 看到结果后的下一步...
 *
 * 本文件把这些消息转成统一的 AgentStepLog 数组，方便写入 graph_state。
 */
import {
  AIMessage,
  BaseMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { AgentStepLog } from "./schemas";

export function extractAgentStepLogs(messages: BaseMessage[]): AgentStepLog[] {
  const logs: AgentStepLog[] = [];
  // 暂存 tool_call，等对应的 ToolMessage 到来时配对
  const pendingCalls = new Map<string, { name: string; input: Record<string, unknown> }>();

  for (const msg of messages) {
    const ts = new Date().toISOString();

    // AI 发的消息：可能是「我要调 Tool」或「最终回答」
    if (AIMessage.isInstance(msg)) {
      const toolCalls = msg.tool_calls ?? [];

      for (const call of toolCalls) {
        const input =
          typeof call.args === "object" && call.args !== null
            ? (call.args as Record<string, unknown>)
            : {};
        pendingCalls.set(call.id ?? call.name, { name: call.name, input });
        logs.push({
          action: "tool_call", // LLM 决定调用某个 Tool
          tool: call.name,
          input,
          timestamp: ts,
        });
      }

      // 没有 tool_calls 的 AI 消息 = 最终文本回复
      if (typeof msg.content === "string" && msg.content.trim() && toolCalls.length === 0) {
        logs.push({
          action: "final_answer",
          reasoning: msg.content.slice(0, 500),
          timestamp: ts,
        });
      }
    }

    // Tool 执行完返回的结果
    if (ToolMessage.isInstance(msg)) {
      const callId = msg.tool_call_id;
      const pending = callId ? pendingCalls.get(callId) : undefined;
      logs.push({
        action: "observation", // Tool 的执行结果
        tool: pending?.name ?? msg.name,
        input: pending?.input,
        output:
          typeof msg.content === "string"
            ? msg.content.slice(0, 2000)
            : JSON.stringify(msg.content).slice(0, 2000),
        timestamp: ts,
      });
    }
  }

  return logs;
}

/** 多次 Agent 调用时，把新日志追加到已有日志后面 */
export function mergeAgentStepLogs(
  existing: AgentStepLog[] = [],
  incoming: AgentStepLog[],
): AgentStepLog[] {
  return [...existing, ...incoming];
}
