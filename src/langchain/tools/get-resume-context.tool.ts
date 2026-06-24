import { tool } from "langchain";
import { z } from "zod";
import { getResumeById } from "../../models/Resum";
import { getAgentContext } from "./agent-context";

/** 读取简历结构化摘要，供 Agent 决定出题方向 */
export const getResumeContextTool = tool(
  async ({ resume_id }) => {
    const ctx = getAgentContext();
    const id = resume_id || ctx.resumeId;
    const resume = await getResumeById(id);
    if (!resume?.parsed_data) return JSON.stringify({ summary: "暂无简历信息", skills: [] });

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
