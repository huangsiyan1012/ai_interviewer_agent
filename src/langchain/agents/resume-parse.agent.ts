/**
 * 简历解析 Agent
 *
 * 这是什么？
 *   一个「会自己决定调什么工具」的 AI 程序。
 *   收到简历文字后，它会：
 *     1. LLM 思考："我需要解析简历"
 *     2. 决定调用 parse_resume 这个 Tool
 *     3. Tool 执行完返回结果（observation）
 *     4. Agent 结束，Service 从 Tool 结果里取出结构化 JSON
 *
 * 技术：LangChain createAgent = ReAct Agent Executor
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

// ── 创建 Agent 实例（应用启动时执行一次，之后复用）──
const resumeParseAgent = createAgent({
  model: createDeepSeekModel(), // 连接 DeepSeek 大模型
  tools: resumeParseTools, // 可用工具列表（只有 parse_resume 一个）
  systemPrompt: new SystemMessage(RESUME_PARSE_AGENT_PROMPT), // 系统人设
  middleware: [
    // 安全阀：单次最多调 2 次 Tool，防止 LLM 死循环
    toolCallLimitMiddleware({ runLimit: 2, exitBehavior: "end" }),
  ],
});

/**
 * 运行简历解析 Agent — Service 层的唯一入口
 * @param resumeText  从文件或粘贴得到的纯文字简历
 * @param resumeId    临时 ID，供 Tool 上下文使用
 * @returns           结构化简历 ParsedResume
 */
export async function runResumeParseAgent(
  resumeText: string,
  resumeId: string,
): Promise<ParsedResume> {
  // 在 AsyncLocalStorage 里挂上 resumeId，Tool 内部可通过 getAgentContext() 读取
  const result = await runWithAgentContext({ resumeId }, async () => {
    return resumeParseAgent.invoke(
      {
        // 发给 Agent 的用户消息（HumanMessage = 用户说的话）
        messages: [
          new HumanMessage(
            `调用 parse_resume tool 解析以下简历（只调用一次）：\n\n${resumeText.slice(0, 12000)}`,
          ),
        ],
      },
      getAgentInvokeConfig(), // recursionLimit 等配置
    );
  });

  // invoke 返回的 messages 里包含完整的 tool_call / observation 记录
  const logs = extractAgentStepLogs(result.messages ?? []);

  // 从后往前找 parse_resume 的 observation（Tool 执行结果）
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    if (log.action === "observation" && log.tool === "parse_resume" && log.output) {
      return JSON.parse(log.output) as ParsedResume;
    }
  }

  throw new Error("简历解析 Agent 未能返回结构化结果");
}
