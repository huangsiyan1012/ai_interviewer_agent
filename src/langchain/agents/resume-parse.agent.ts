/**
 * 简历解析 Agent — 通过 parse_resume tool 完成解析
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createAgent, toolCallLimitMiddleware } from "langchain";
import { createDeepSeekModel } from "../../llm";
import { getAgentInvokeConfig } from "./agent-config";
import { extractAgentStepLogs } from "./agent-runner";
import { RESUME_PARSE_AGENT_PROMPT } from "../prompts/agent.prompt";
import { resumeParseTools } from "../tools";
import { runWithAgentContext } from "../tools/agent-context";
import type { ParsedResume } from "../../types/resume";

const resumeParseAgent = createAgent({
  model: createDeepSeekModel(),
  tools: resumeParseTools,
  systemPrompt: new SystemMessage(RESUME_PARSE_AGENT_PROMPT),
  middleware: [
    toolCallLimitMiddleware({ runLimit: 2, exitBehavior: "end" }),
  ],
});

/** 运行简历解析 Agent，返回结构化简历 */
export async function runResumeParseAgent(
  resumeText: string,
  resumeId: string,
): Promise<ParsedResume> {
  const result = await runWithAgentContext({ resumeId }, async () => {
    return resumeParseAgent.invoke(
      {
        messages: [
          new HumanMessage(
            `调用 parse_resume tool 解析以下简历（只调用一次）：\n\n${resumeText.slice(0, 12000)}`,
          ),
        ],
      },
      getAgentInvokeConfig(),
    );
  });

  const logs = extractAgentStepLogs(result.messages ?? []);
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (log.action === "observation" && log.tool === "parse_resume" && log.output) {
      return JSON.parse(log.output) as ParsedResume;
    }
  }

  throw new Error("简历解析 Agent 未能返回结构化结果");
}
