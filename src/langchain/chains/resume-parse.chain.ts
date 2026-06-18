import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createDeepSeekModel } from "../../llm";
import { buildResumeParsePrompt } from "../prompts/resume-parse.prompt";
import { parseResumeJson } from "../parsers/resume.parser";
import type { ParsedResume } from "../../types/resume";

/**
 * 简历解析 Chain
 * 调用方：ResumeParseWorkflow / ResumeService.uploadResumeFromText
 */
export async function parseResumeChain(
  resumeText: string,
): Promise<ParsedResume> {
  const model = createDeepSeekModel();
  const prompt = buildResumeParsePrompt(resumeText);

  const response = await model.invoke([
    new SystemMessage("你只输出 JSON，不要 markdown 代码块，不要额外解释。"),
    new HumanMessage(prompt),
  ]);

  const content =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return parseResumeJson(content);
}
