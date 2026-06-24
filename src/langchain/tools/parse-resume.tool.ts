import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "langchain";
import { z } from "zod";
import { createDeepSeekModel } from "../../llm";
import { parseResumeJson } from "../parsers/resume.parser";
import { buildResumeParsePrompt } from "../prompts/resume-parse.prompt";

/** 将简历纯文本解析为结构化 JSON（简历上传专用） */
export const parseResumeTool = tool(
  async ({ resume_text }) => {
    const text = resume_text.trim();
    if (!text) return JSON.stringify({ error: "简历文本为空" });

    const model = createDeepSeekModel();
    const prompt = buildResumeParsePrompt(text);
    const response = await model.invoke([
      new SystemMessage("你只输出 JSON，不要 markdown 代码块，不要额外解释。"),
      new HumanMessage(prompt),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    return JSON.stringify(parseResumeJson(content));
  },
  {
    name: "parse_resume",
    description: "将简历纯文本解析为结构化 JSON（姓名、技能、项目等）",
    schema: z.object({
      resume_text: z.string().describe("简历全文"),
    }),
  },
);
