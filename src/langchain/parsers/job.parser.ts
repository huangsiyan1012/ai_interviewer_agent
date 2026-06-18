import type { ParsedJob } from "../../types/job";

export function parseJobJson(raw: string): ParsedJob {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("LLM 返回内容中未找到 JSON");

  const data = JSON.parse(match[0]);

  return {
    title: String(data.title ?? "未知岗位"),
    category: String(data.category ?? "通用"),
    requirements: String(data.requirements ?? ""),
    keySkills: Array.isArray(data.keySkills)
      ? data.keySkills.map(String)
      : [],
  };
}
