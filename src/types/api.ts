import type { AgentStepLog } from "../langchain/agents/schemas";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 面试会话状态快照 — 存在 interview_sessions.graph_state（JSON 字段）
 *
 * 这是整个面试过程中最重要的状态对象：
 *   - 前端刷新页面靠 messages / currentQuestion 恢复
 *   - 追问时靠 jobKnowledge 复用岗位解析结果（不再调 analyze_job）
 *   - 调试时靠 toolExecutionHistory 看 Agent 做了什么
 */
export interface SessionGraphState {
  jobDescription?: string;
  jobKnowledge?: string;
  interviewEnded?: boolean;
  jobId?: string;
  currentQuestion?: string;
  /** 用户界面上看到的对话消息 */
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  /** Agent 内部记忆快照 */
  agentMemory?: Array<{ role: string; content: string }>;
  /** Agent 每次调 Tool 的完整日志 */
  toolExecutionHistory?: AgentStepLog[];
}
