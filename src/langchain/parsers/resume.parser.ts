/**
 * 简历 JSON 解析器
 *
 * LLM 返回的不一定是「干净 JSON」，可能带 markdown 或多余文字。
 * 这个文件负责：从 LLM 原始输出里「抠出」JSON，转成 TypeScript 对象。
 */
import type { ParsedResume } from "../../types/resume";

export function parseResumeJson(raw: string): ParsedResume {
  // 用正则匹配第一个 { ... } 块（贪婪匹配，应对 LLM 前后有多余文字的情况）
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM 返回内容中未找到 JSON");
  }

  const data = JSON.parse(jsonMatch[0]);

  // 逐字段提取，缺失字段给默认值，防止 LLM 漏字段导致崩溃
  return {
    summary: String(data.summary ?? ""),
    skills: Array.isArray(data.skills) ? data.skills.map(String) : [],
    projects: Array.isArray(data.projects)
      ? data.projects.map((p: Record<string, unknown>) => ({
          name: String(p.name ?? ""),
          description: String(p.description ?? ""),
        }))
      : [],
    experience: Array.isArray(data.experience)
      ? data.experience.map((e: Record<string, unknown>) => ({
          company: String(e.company ?? ""),
          role: String(e.role ?? ""),
          duration: String(e.duration ?? ""),
        }))
      : [],
  };
}
