import { AsyncLocalStorage } from "async_hooks";

/** 单次 Agent 运行时的上下文，供 Tools 读取 session / resume 等 ID */
export interface AgentToolContext {
  sessionId?: string;
  resumeId: string;
  jobRole?: string;
  jobDescription?: string;
  jobKnowledge?: string;
  currentRound?: number;
  minRounds?: number;
  maxRounds?: number;
  lastQuestion?: string;
  lastAnswer?: string;
}

const store = new AsyncLocalStorage<AgentToolContext>();

export function getAgentContext(): AgentToolContext {
  const ctx = store.getStore();
  if (!ctx) throw new Error("Agent 工具上下文未初始化");
  return ctx;
}

/** 在指定上下文中执行 Agent，保证 Tools 能访问 session 信息 */
export async function runWithAgentContext<T>(
  ctx: AgentToolContext,
  fn: () => Promise<T>,
): Promise<T> {
  return store.run(ctx, fn);
}
