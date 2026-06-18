import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createDeepSeekModel } from "../../llm";
import { buildQuestionPrompt } from "../prompts/question.prompt";
import { parseQuestionJson } from "../parsers/question.parser";
import type { Question } from "../../types/interview";

/**
 * 首轮出题 Chain
 * 调用方：QuestionGenerateWorkflow
 */
export async function generateQuestionChain(input: {
  jobRole: string;
  resumeSummary: string;
  resumeSkills: string[];
  jobKnowledge: string;
  questionBankHints: string;
  knowledgeHints: string;
}): Promise<Question> {
  const model = createDeepSeekModel();
  const prompt = buildQuestionPrompt(input);

  const response = await model.invoke([
    new SystemMessage("你只输出 JSON，不要 markdown，不要额外解释。"),
    new HumanMessage(prompt),
  ]);

  const content =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return parseQuestionJson(content);
}
