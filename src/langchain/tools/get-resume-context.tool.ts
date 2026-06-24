/**
 * get_resume_context Tool — 读取候选人简历
 *
 * 从 MySQL 读 resumes.parsed_data（上一步简历解析 Agent 存进去的）。
 * 不调 LLM，纯数据库查询。
 */
import { tool } from "langchain";
import { z } from "zod";
import { getResumeById } from "../../models/Resum";
import { getAgentContext } from "./agent-context";

export const getResumeContextTool = tool(
  async ({ resume_id }) => {
    const ctx = getAgentContext();
    const id = resume_id || ctx.resumeId; // 省略参数时用上下文里的 resumeId

    const resume = await getResumeById(id);
    if (!resume?.parsed_data) {
      return JSON.stringify({ summary: "暂无简历信息", skills: [] });
    }

    const d = resume.parsed_data;
    return JSON.stringify({
      summary: d.summary ?? "",
      skills: d.skills ?? [],
      projects: (d.projects ?? []).map((p: { name: string }) => p.name),
      formatted: [
        `摘要：${d.summary ?? ""}`,
        `技能：${(d.skills ?? []).join("、")}`,
        `项目：${(d.projects ?? []).map((p: { name: string }) => p.name).join("、")}`,
      ].join("\n"),
    });
  },
  {
    name: "get_resume_context",
    description: "获取候选人简历的结构化摘要、技能和项目经历",
    schema: z.object({
      resume_id: z.string().optional().describe("简历 ID，省略则使用当前会话简历"),
    }),
  },
);
