import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createDeepSeekModel } from "../../llm";
import type { ParsedJob } from "../../types/job";
import { parseJobJson } from "../parsers/job.parser";
import { buildJobAnalyzePrompt } from "../prompts/job-analyze.prompt";

/**
 * 岗位分析 Chain
 * 调用方：InterviewService.startInterview（直接调 Chain，不经 Workflow）
 */
export async function analyzeJobChain(
  jobDescription: string,
): Promise<ParsedJob> {
  const model = createDeepSeekModel();
  const prompt = buildJobAnalyzePrompt(jobDescription);

  const response = await model.invoke([
    new SystemMessage("你只输出 JSON，不要 markdown 代码块，不要额外解释。"),
    new HumanMessage(prompt),
  ]);

  const content =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return parseJobJson(content);
}
