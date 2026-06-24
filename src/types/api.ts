import type { AgentStepLog } from "../langchain/agents/schemas";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface SessionGraphState {
  jobDescription?: string;
  jobKnowledge?: string;
  interviewEnded?: boolean;
  jobId?: string;
  currentQuestion?: string;
  /** 用户可见的对话消息 */
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Agent 内部记忆（含 tool call 上下文，用于恢复） */
  agentMemory?: Array<{ role: string; content: string }>;
  /** Agent tool 执行历史：tool_call → observation → final_answer */
  toolExecutionHistory?: AgentStepLog[];
}
