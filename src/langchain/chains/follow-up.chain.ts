import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createDeepSeekModel } from "../../llm";
import { buildFollowUpPrompt } from "../prompts/follow-up.prompt";
import { parseAgentResponseJson } from "../parsers/question.parser";
import type { AgentResponse } from "../../types/interview";

/**
 * 追问 Chain — LLM 调用的最小单元
 *
 * 固定三步：buildPrompt → model.invoke → parseJson
 * 调用方：invokeInterviewerAgent
 */
export async function followUpChain(input: {
  jobRole: string;
  resumeSummary: string;
  jobKnowledge: string;
  knowledgeHints: string;
  historyText: string;
  currentRound: number;
  minRounds: number;
  maxRounds: number;
  lastQuestion: string;
  lastAnswer: string;
}): Promise<AgentResponse> {
  const model = createDeepSeekModel();
  const prompt = buildFollowUpPrompt(input);

  const response = await model.invoke([
    new SystemMessage("你只输出 JSON，不要 markdown，不要额外解释。"),
    new HumanMessage(prompt),
  ]);

  const content =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return parseAgentResponseJson(content);
}
