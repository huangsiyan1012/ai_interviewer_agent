/**
 * RAG 模块入口
 *
 * 模块职责：
 * - types    → 类型定义
 * - config   → 知识库路径、岗位映射
 * - loader   → 读取 Markdown 文件
 * - splitter → 文档切片
 * - indexer  → 构建内存索引
 * - retriever→ 检索（JD + 题库 + 知识库）
 */

export type { KnowledgeBase, DocumentChunk, SearchResult } from "./types";
export { KNOWLEDGE_BASES, resolveKnowledgeBases } from "./config";
export { loadMarkdownFiles, loadAllMarkdownFiles } from "./loader";
export { splitMarkdown } from "./splitter";
export { initKnowledgeIndex, getKnowledgeIndex, buildKnowledgeIndex } from "./indexer";
export {
  retrieveJobKnowledge,
  retrieveQuestionBank,
  retrieveKnowledge,
  searchKnowledge,
} from "./retriever";
