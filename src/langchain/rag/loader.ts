import fs from "fs";
import path from "path";
import { KNOWLEDGE_ROOT } from "./config";
import type { KnowledgeBase, MarkdownDocument } from "./types";

/**
 * 加载器：从磁盘读取指定知识库下的所有 .md 文件
 * 职责单一 —— 只负责「读文件」，不做切片和检索
 */
export function loadMarkdownFiles(knowledgeBase: KnowledgeBase): MarkdownDocument[] {
  const dir = path.join(KNOWLEDGE_ROOT, knowledgeBase);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const documents: MarkdownDocument[] = [];

  for (const fileName of files) {
    const filePath = path.join(dir, fileName);
    const content = fs.readFileSync(filePath, "utf-8").trim();
    if (!content) continue;

    documents.push({ knowledgeBase, fileName, content });
  }

  return documents;
}

/** 加载全部知识库的 Markdown 文档 */
export function loadAllMarkdownFiles(): MarkdownDocument[] {
  const bases: KnowledgeBase[] = ["frontend", "java", "test", "algorithm"];
  return bases.flatMap((kb) => loadMarkdownFiles(kb));
}
