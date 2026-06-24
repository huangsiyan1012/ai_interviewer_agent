/**
 * Agent Tool 上下文传递
 *
 * 问题：Tool 函数是独立定义的，运行时怎么知道当前是哪个 resumeId / sessionId？
 * 解法：用 Node.js 的 AsyncLocalStorage，在 Agent 运行期间"全局"存一份上下文，
 *       Tool 内部通过 getAgentContext() 读取。
 *
 * 类比：给整个 Agent 运行过程发一张「工牌」，Tool 刷卡就知道在处理哪份简历。
 */
import { AsyncLocalStorage } from "async_hooks";

/** 单次 Agent 运行时携带的信息 */
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

// 创建一个「线程局部存储」，每个 Agent 调用互不干扰
const store = new AsyncLocalStorage<AgentToolContext>();

/** Tool 内部调用：读取当前 Agent 运行的上下文 */
export function getAgentContext(): AgentToolContext {
  const ctx = store.getStore();
  if (!ctx) throw new Error("Agent 工具上下文未初始化");
  return ctx;
}

/**
 * 在指定上下文中执行 Agent
 * @param ctx  本次运行的 sessionId / resumeId 等
 * @param fn   真正跑 Agent 的异步函数
 */
export async function runWithAgentContext<T>(
  ctx: AgentToolContext,
  fn: () => Promise<T>,
): Promise<T> {
  // store.run 会在 fn 执行期间把 ctx 挂到当前异步链上
  return store.run(ctx, fn);
}
