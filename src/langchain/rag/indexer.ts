import config from "../../config/config";
import { loadAllMarkdownFiles } from "./loader";
import { splitMarkdown } from "./splitter";
import type { DocumentChunk } from "./types";

/** 内存索引（启动时构建，全程复用） */
let cachedChunks: DocumentChunk[] | null = null;

/**
 * 索引器：加载 Markdown → 切片 → 存入内存
 * 服务启动时调用一次 initKnowledgeIndex()
 */
export function buildKnowledgeIndex(): DocumentChunk[] {
  const documents = loadAllMarkdownFiles();
  return documents.flatMap((doc) => splitMarkdown(doc));
}

/** 初始化知识库索引（幂等，可重复调用） */
export function initKnowledgeIndex(): DocumentChunk[] {
  if (!config.rag.enabled) {
    cachedChunks = [];
    console.log("📚 RAG 已关闭（设置 RAG_ENABLED=true 可开启）");
    return cachedChunks;
  }

  cachedChunks = buildKnowledgeIndex();
  console.log(`📚 RAG 知识库已加载：${cachedChunks.length} 个文档块`);
  return cachedChunks;
}

/** 获取当前索引，若未初始化则自动构建 */
export function getKnowledgeIndex(): DocumentChunk[] {
  if (!config.rag.enabled) return [];

  if (!cachedChunks) {
    cachedChunks = buildKnowledgeIndex();
  }
  return cachedChunks;
}
