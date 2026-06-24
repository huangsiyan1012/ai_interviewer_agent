import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "langchain";
import { z } from "zod";
import { createDeepSeekModel } from "../../llm";
import { parseJobJson } from "../parsers/job.parser";
import { buildJobAnalyzePrompt } from "../prompts/job-analyze.prompt";
import { formatJobKnowledge } from "../../types/job";
import { getAgentContext } from "./agent-context";

/** 解析岗位描述，提取 title / 技能要求 / JD 要点 */
export const analyzeJobTool = tool(
  async ({ job_description }) => {
    const ctx = getAgentContext();
    const text = (job_description || ctx.jobDescription || "").trim();
    if (!text) return JSON.stringify({ error: "岗位描述为空" });

    const model = createDeepSeekModel();
    const prompt = buildJobAnalyzePrompt(text);
    const response = await model.invoke([
      new SystemMessage("你只输出 JSON，不要 markdown 代码块，不要额外解释。"),
      new HumanMessage(prompt),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const parsed = parseJobJson(content);
    return JSON.stringify({
      title: parsed.title,
      category: parsed.category,
      requirements: parsed.requirements,
      keySkills: parsed.keySkills,
      jobKnowledge: formatJobKnowledge(parsed),
    });
  },
  {
    name: "analyze_job",
    description: "解析用户填写的岗位描述，提取岗位名称、核心要求和关键技能",
    schema: z.object({
      job_description: z.string().optional().describe("岗位描述全文，省略则使用当前会话岗位"),
    }),
  },
);
