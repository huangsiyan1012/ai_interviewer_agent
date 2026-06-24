import {
  AIMessage,
  BaseMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { AgentStepLog } from "./schemas";

/** 从 Agent 消息链中提取 tool call / observation 日志 */
export function extractAgentStepLogs(messages: BaseMessage[]): AgentStepLog[] {
  const logs: AgentStepLog[] = [];
  const pendingCalls = new Map<string, { name: string; input: Record<string, unknown> }>();

  for (const msg of messages) {
    const ts = new Date().toISOString();

    if (AIMessage.isInstance(msg)) {
      const toolCalls = msg.tool_calls ?? [];
      for (const call of toolCalls) {
        const input =
          typeof call.args === "object" && call.args !== null
            ? (call.args as Record<string, unknown>)
            : {};
        pendingCalls.set(call.id ?? call.name, { name: call.name, input });
        logs.push({
          action: "tool_call",
          tool: call.name,
          input,
          timestamp: ts,
        });
      }

      if (typeof msg.content === "string" && msg.content.trim() && toolCalls.length === 0) {
        logs.push({
          action: "final_answer",
          reasoning: msg.content.slice(0, 500),
          timestamp: ts,
        });
      }
    }

    if (ToolMessage.isInstance(msg)) {
      const callId = msg.tool_call_id;
      const pending = callId ? pendingCalls.get(callId) : undefined;
      logs.push({
        action: "observation",
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

/** 合并多次 Agent 调用的日志 */
export function mergeAgentStepLogs(
  existing: AgentStepLog[] = [],
  incoming: AgentStepLog[],
): AgentStepLog[] {
  return [...existing, ...incoming];
}
