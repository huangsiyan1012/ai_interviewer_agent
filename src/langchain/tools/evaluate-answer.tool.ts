import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "langchain";
import { z } from "zod";
import { createPreciseModel } from "../../llm";
import { parseEvaluationJson } from "../parsers/question.parser";
import { buildEvaluationPrompt } from "../prompts/evaluation.prompt";
import { getAgentContext } from "./agent-context";

/** 根据完整面试记录生成结构化评估报告 */
export const evaluateAnswerTool = tool(
  async ({ job_role, qa_records }) => {
    const ctx = getAgentContext();
    const role = job_role || ctx.jobRole || "技术岗位";
    const records = qa_records?.trim();
    if (!records) {
      return JSON.stringify({ error: "缺少面试问答记录，请先调用 fetch_interview_history" });
    }

    const model = createPreciseModel();
    const prompt = buildEvaluationPrompt({ jobRole: role, qaRecords: records });

    const response = await model.invoke([
      new SystemMessage("你只输出 JSON，不要 markdown，不要额外解释。"),
      new HumanMessage(prompt),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const report = parseEvaluationJson(content);
    return JSON.stringify(report);
  },
  {
    name: "evaluate_answer",
    description:
      "对完整面试问答记录进行多维度评估，输出结构化评分报告。需先获取 history。",
    schema: z.object({
      job_role: z.string().optional().describe("目标岗位"),
      qa_records: z.string().describe("格式化的完整问答记录文本"),
    }),
  },
);
