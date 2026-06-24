/**
 * analyze_job Tool — 解析用户填写的岗位描述
 *
 * 开始面试时 Agent 第一个调用的 Tool 之一。
 * 把用户随意写的岗位文字 → 结构化 JSON（岗位名、技能要求等）。
 *
 * 内部会调一次 LLM（和 parse_resume Tool 类似）。
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "langchain";
import { z } from "zod";
import { createDeepSeekModel } from "../../llm";
import { parseJobJson } from "../parsers/job.parser";
import { buildJobAnalyzePrompt } from "../prompts/job-analyze.prompt";
import { formatJobKnowledge } from "../../types/job";
import { getAgentContext } from "./agent-context";

export const analyzeJobTool = tool(
  async ({ job_description }) => {
    // 优先用 Agent 传入的参数，没传则从上下文读（runWithAgentContext 挂的 jobDescription）
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

    // 返回给 Agent 的 observation（Agent 和 Service 都会用到）
    return JSON.stringify({
      title: parsed.title,               // 岗位名，Service 写入 job_role
      category: parsed.category,
      requirements: parsed.requirements,
      keySkills: parsed.keySkills,
      jobKnowledge: formatJobKnowledge(parsed), // 格式化文本，写入 graph_state
    });
  },
  {
    name: "analyze_job",
    description: "解析用户填写的岗位描述，提取岗位名称、核心要求和关键技能",
    schema: z.object({
      job_description: z
        .string()
        .optional()
        .describe("岗位描述全文，省略则使用当前会话岗位"),
    }),
  },
);
