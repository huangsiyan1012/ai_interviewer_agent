import path from "path";
import { fileURLToPath } from "url";
import type { KnowledgeBase } from "./types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 知识库 Markdown 根目录 */
export const KNOWLEDGE_ROOT = path.join(
  __dirname,
  "../../../data/knowledge",
);

/** 所有知识库列表 */
export const KNOWLEDGE_BASES: KnowledgeBase[] = [
  "frontend",
  "java",
  "test",
  "algorithm",
];

/**
 * 岗位 → 知识库映射
 * 面试官出题时，优先从对应知识库检索参考资料
 */
export const JOB_ROLE_TO_KB: Record<string, KnowledgeBase[]> = {
  前端开发: ["frontend", "algorithm"],
  Java后端: ["java", "algorithm"],
  测试工程师: ["test"],
};

/** 根据岗位名称解析应检索的知识库 */
export function resolveKnowledgeBases(jobRole: string): KnowledgeBase[] {
  const matched = JOB_ROLE_TO_KB[jobRole];
  if (matched) return matched;

  // 未匹配岗位时，做简单关键词推断
  const role = jobRole.toLowerCase();
  if (role.includes("前端") || role.includes("frontend")) return ["frontend"];
  if (role.includes("java") || role.includes("后端")) return ["java"];
  if (role.includes("测试") || role.includes("test")) return ["test"];
  if (role.includes("算法")) return ["algorithm"];

  return KNOWLEDGE_BASES;
}
