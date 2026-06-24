/**
 * generate_question Tool — 生成面试题（最核心的 Tool）
 *
 * 把前面几个 Tool 收集的信息（简历、岗位、题库）拼成 Prompt，
 * 调 LLM 生成一道面试题。
 *
 * purpose 参数决定出题风格：
 *   first     → 第一题，通常是自我介绍/破冰
 *   follow_up → 针对上一轮回答追问
 *   next      → 切换到新话题
 */
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "langchain";
import { z } from "zod";
import { createDeepSeekModel } from "../../llm";
import { parseQuestionJson } from "../parsers/question.parser";
import { buildQuestionPrompt } from "../prompts/question.prompt";
import { retrieveKnowledge } from "../rag/retriever";
import { getAgentContext } from "./agent-context";

export const generateQuestionTool = tool(
  async ({
    job_role,
    resume_summary,
    resume_skills,
    job_knowledge,
    question_bank_hints,
    purpose,
  }) => {
    const ctx = getAgentContext();
    const role = job_role || ctx.jobRole || "技术岗位";
    const skills = resume_skills ?? [];

    // 可选：从 Markdown 知识库检索（RAG_ENABLED=true 时生效）
    const ragQuery = `${skills.join(" ")} ${role}`;
    const knowledgeHints =
      retrieveKnowledge(ragQuery, role) || "（无额外知识库参考）";

    const model = createDeepSeekModel();
    const prompt = buildQuestionPrompt({
      jobRole: role,
      resumeSummary: resume_summary || "暂无",
      resumeSkills: skills,
      jobKnowledge: job_knowledge || ctx.jobKnowledge || "暂无",
      questionBankHints: question_bank_hints || "暂无",
      knowledgeHints,
    });

    // 根据 purpose 给 LLM 额外指令
    const systemExtra =
      purpose === "first"
        ? "这是面试的第一个问题，通常是自我介绍或破冰。"
        : purpose === "follow_up"
          ? "这是基于上一轮回答的追问，要针对候选人回答中的薄弱点或亮点深入。"
          : "这是切换到新话题的下一题。";

    const response = await model.invoke([
      new SystemMessage(
        `你只输出 JSON，不要 markdown，不要额外解释。${systemExtra}`,
      ),
      new HumanMessage(prompt),
    ]);

    const content =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const question = parseQuestionJson(content);
    // 返回的题目会被 interviewer.agent 解析成 decision.question
    return JSON.stringify(question);
  },
  {
    name: "generate_question",
    description:
      "根据简历、岗位 JD 和题库参考生成一道面试题。调用前应先通过其他 tool 收集上下文。",
    schema: z.object({
      job_role: z.string().optional().describe("目标岗位"),
      resume_summary: z.string().optional().describe("简历摘要"),
      resume_skills: z.array(z.string()).optional().describe("候选人技能列表"),
      job_knowledge: z.string().optional().describe("岗位 JD 要点"),
      question_bank_hints: z.string().optional().describe("题库检索结果"),
      purpose: z
        .enum(["first", "follow_up", "next"])
        .optional()
        .describe("出题目的：首轮 / 追问 / 换题"),
    }),
  },
);
