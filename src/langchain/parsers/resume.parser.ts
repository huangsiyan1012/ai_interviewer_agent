import type { ParsedResume } from "../../types/resume";

/** 把 LLM 返回的文本解析成 ParsedResume */
export function parseResumeJson(raw: string): ParsedResume {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("LLM 返回内容中未找到 JSON");
  }

  const data = JSON.parse(jsonMatch[0]);

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
