/**
 * LangChain 能力层入口
 *
 * 分层说明（对应 ARCHITECTURE.md）：
 * - llm/       → 大模型连接（已实现在 src/llm/）
 * - prompts/   → Prompt 模板
 * - chains/    → 链式调用
 * - parsers/   → 结构化输出解析
 * - agents/    → ReAct Agent（面试官 / 评估师）
 * - memory/    → 会话记忆
 * - rag/       → 向量检索
 * - tools/     → Agent 工具
 */

// LLM 沿用已有目录
export { createDeepSeekModel, createPreciseModel } from "../llm";

// 子模块占位（Step 2 起逐步实现）
export * as prompts from "./prompts";
export * as chains from "./chains";
export * as parsers from "./parsers";
export * as agents from "./agents";
export * as memory from "./memory";
export * as rag from "./rag";
export * as tools from "./tools";
