import config from "../../config/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getJobById } from "../../models/Job";
import { resolveKnowledgeBases } from "./config";
import { getKnowledgeIndex } from "./indexer";
import type { DocumentChunk, KnowledgeBase, SearchResult } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUESTION_BANK_PATH = path.join(
  __dirname,
  "../../../data/knowledge/question-bank.json",
);

interface BankItem {
  type: string;
  difficulty: string;
  tags: string[];
  question: string;
}

// ─────────────────────────────────────────────
// 1. 岗位 JD 检索（来自数据库）
// ─────────────────────────────────────────────

export async function retrieveJobKnowledge(jobId: string): Promise<string> {
  const job = await getJobById(jobId);
  if (!job) return "暂无岗位 JD";
  return `岗位：${job.title}\n类别：${job.category}\n要求：${job.jd_text ?? ""}`;
}

// ─────────────────────────────────────────────
// 2. 题库检索（JSON 关键词匹配）
// ─────────────────────────────────────────────

function loadQuestionBank(): BankItem[] {
  if (!fs.existsSync(QUESTION_BANK_PATH)) return [];
  return JSON.parse(fs.readFileSync(QUESTION_BANK_PATH, "utf-8"));
}

export function retrieveQuestionBank(
  query: string,
  jobRole: string,
  topK = 3,
): string {
  const bank = loadQuestionBank();
  const keywords = `${query} ${jobRole}`.toLowerCase();

  const scored = bank.map((item) => {
    let score = 0;
    for (const tag of item.tags) {
      if (keywords.includes(tag.toLowerCase())) score += 2;
    }
    if (keywords.includes(item.type)) score += 1;
    return { item, score };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(
      (s, i) =>
        `${i + 1}. [${s.item.type}/${s.item.difficulty}] ${s.item.question}`,
    );

  return top.length > 0
    ? top.join("\n")
    : "暂无匹配参考题，请根据 JD 和简历自由出题。";
}

// ─────────────────────────────────────────────
// 3. Markdown 知识库检索（RAG 核心）
// ─────────────────────────────────────────────

/** 把查询文本拆成关键词 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,，、。；;：:]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/** 计算文档块与查询的匹配分数 */
function scoreChunk(chunk: DocumentChunk, query: string): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  const title = chunk.title.toLowerCase();
  const content = chunk.content.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (title.includes(token)) score += 3;
    if (content.includes(token)) score += 1;
  }

  return score;
}

/** 在指定知识库中搜索，返回按分数排序的结果 */
export function searchKnowledge(
  query: string,
  knowledgeBases: KnowledgeBase[],
  topK = 3,
): SearchResult[] {
  if (!config.rag.enabled) return [];

  const chunks = getKnowledgeIndex().filter((c) =>
    knowledgeBases.includes(c.knowledgeBase),
  );

  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/** 根据岗位自动选择知识库并检索，返回格式化文本 */
export function retrieveKnowledge(
  query: string,
  jobRole: string,
  topK = 3,
): string {
  if (!config.rag.enabled) return "";

  const bases = resolveKnowledgeBases(jobRole);
  const results = searchKnowledge(query, bases, topK);

  if (results.length === 0) {
    return "暂无匹配知识库内容，请根据 JD 和简历自由出题。";
  }

  return results
    .map(
      (r, i) =>
        `${i + 1}. [${r.chunk.knowledgeBase}/${r.chunk.title}]\n${r.chunk.content}`,
    )
    .join("\n\n");
}
