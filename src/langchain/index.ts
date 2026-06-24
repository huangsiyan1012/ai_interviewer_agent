/**
 * LangChain 能力层入口
 *
 * 架构：Agent Executor → LLM → Tools → Observation → Loop
 * - agents/  → Tool-calling ReAct Agent（面试官 / 评估师 / 简历解析）
 * - tools/   → 独立 Tool 函数，由 Agent 动态调用
 * - prompts/ → Prompt 模板（供 Tools 内部使用）
 * - memory/  → 会话记忆
 * - rag/     → 向量检索
 */

export { createDeepSeekModel, createPreciseModel } from "../llm";

export * as prompts from "./prompts";
export * as chains from "./chains";
export * as parsers from "./parsers";
export * as agents from "./agents";
export * as memory from "./memory";
export * as rag from "./rag";
export * as tools from "./tools";
