/** 支持的知识库名称 */
export type KnowledgeBase = "frontend" | "java" | "test" | "algorithm";

/** Markdown 原始文档 */
export interface MarkdownDocument {
  knowledgeBase: KnowledgeBase;
  fileName: string;
  content: string;
}

/** 切片后的文档块（RAG 检索的最小单位） */
export interface DocumentChunk {
  id: string;
  knowledgeBase: KnowledgeBase;
  sourceFile: string;
  title: string;
  content: string;
}

/** 检索结果 */
export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}
