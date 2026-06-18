import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createPreciseModel } from "../../llm";
import { buildEvaluationPrompt } from "../prompts/evaluation.prompt";
import { parseEvaluationJson } from "../parsers/question.parser";
import type { EvaluationReportData } from "../../types/interview";

/**
 * 评估 Chain — 使用低温度模型，输出更稳定
 * 调用方：invokeEvaluatorAgent
 */
export async function evaluationChain(input: {
  jobRole: string;
  qaRecords: string;
}): Promise<EvaluationReportData> {
  const model = createPreciseModel(); // temperature=0.2
  const prompt = buildEvaluationPrompt(input);

  const response = await model.invoke([
    new SystemMessage("你只输出 JSON，不要 markdown，不要额外解释。"),
    new HumanMessage(prompt),
  ]);

  const content =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return parseEvaluationJson(content);
}
