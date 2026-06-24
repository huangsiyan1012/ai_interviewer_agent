/**
 * parse_resume Tool — 简历解析工具
 *
 * 这是 Agent 可以「调用」的一个函数。
 * LangChain 的 tool() 会做两件事：
 *   1. 把函数注册成 LLM 能识别的 Tool（带 name / description / 参数 schema）
 *   2. LLM 决定调用时，框架自动执行这个函数并把结果返回给 LLM
 *
 * 注意：Tool 内部会再调一次 LLM（DeepSeek），把非结构化文字 → 结构化 JSON。
 * 所以一次简历解析实际有 2 次 LLM 调用：
 *   第 1 次：Agent 的 LLM 决定「我要调 parse_resume」
 *   第 2 次：Tool 内部的 LLM 做真正的简历解析
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "langchain";
import { z } from "zod";
import { createDeepSeekModel } from "../../llm";
import { parseResumeJson } from "../parsers/resume.parser";
import { buildResumeParsePrompt } from "../prompts/resume-parse.prompt";

export const parseResumeTool = tool(
  // ── 第一个参数：Tool 被调用时执行的函数 ──
  async ({ resume_text }) => {
    const text = resume_text.trim();
    if (!text) return JSON.stringify({ error: "简历文本为空" });

    const model = createDeepSeekModel();

    // 把简历文字填进 Prompt 模板
    const prompt = buildResumeParsePrompt(text);

    // 调 DeepSeek，要求只输出 JSON
    const response = await model.invoke([
      new SystemMessage("你只输出 JSON，不要 markdown 代码块，不要额外解释。"),
      new HumanMessage(prompt),
    ]);

    // LLM 返回的内容可能是 string，也可能是对象，统一成 string
    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // 从 LLM 返回的文本里提取 JSON，转成 ParsedResume 对象
    // 再 JSON.stringify 返回给 Agent（Tool 返回值必须是 string）
    return JSON.stringify(parseResumeJson(content));
  },

  // ── 第二个参数：Tool 的元信息（LLM 靠这些决定要不要调、怎么调）──
  {
    name: "parse_resume", // Tool 名称，LLM tool_call 时用这个名字
    description: "将简历纯文本解析为结构化 JSON（姓名、技能、项目等）",
    schema: z.object({
      // LLM 调用时必须传 resume_text 参数（Zod 定义参数类型）
      resume_text: z.string().describe("简历全文"),
    }),
  },
);
