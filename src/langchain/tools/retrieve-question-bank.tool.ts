import { tool } from "langchain";
import { z } from "zod";
import { retrieveQuestionBank } from "../rag/retriever";
import { getAgentContext } from "./agent-context";

/** 从题库检索与岗位/技能相关的参考面试题 */
export const retrieveQuestionBankTool = tool(
  async ({ query, job_role }) => {
    const ctx = getAgentContext();
    const q = query || ctx.jobRole || "技术面试";
    const role = job_role || ctx.jobRole || "通用";
    const hints = retrieveQuestionBank(q, role);
    return JSON.stringify({ hints, query: q, jobRole: role });
  },
  {
    name: "retrieve_question_bank",
    description: "检索与岗位或技能相关的参考面试题，辅助出题",
    schema: z.object({
      query: z.string().optional().describe("检索关键词，如技能栈或岗位名"),
      job_role: z.string().optional().describe("目标岗位名称"),
    }),
  },
);
