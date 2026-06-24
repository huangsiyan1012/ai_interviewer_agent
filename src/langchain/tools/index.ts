/**
 * LangChain Tools — 独立函数，由 Agent 动态选择与调用
 *
 * 每个 Tool 封装一项原子能力（读 DB / 调 LLM / 检索题库），
 * Agent Executor 负责决定调用顺序，代码不再写死 pipeline。
 */
export { getAgentContext, runWithAgentContext } from "./agent-context";
export type { AgentToolContext } from "./agent-context";

export { getResumeContextTool } from "./get-resume-context.tool";
export { analyzeJobTool } from "./analyze-job.tool";
export { retrieveQuestionBankTool } from "./retrieve-question-bank.tool";
export { fetchInterviewHistoryTool } from "./fetch-interview-history.tool";
export { generateQuestionTool } from "./generate-question.tool";
export { evaluateAnswerTool } from "./evaluate-answer.tool";
export { parseResumeTool } from "./parse-resume.tool";

import { analyzeJobTool } from "./analyze-job.tool";
import { evaluateAnswerTool } from "./evaluate-answer.tool";
import { fetchInterviewHistoryTool } from "./fetch-interview-history.tool";
import { generateQuestionTool } from "./generate-question.tool";
import { getResumeContextTool } from "./get-resume-context.tool";
import { parseResumeTool } from "./parse-resume.tool";
import { retrieveQuestionBankTool } from "./retrieve-question-bank.tool";

/** 面试官 Agent 可用工具集 */
export const interviewerTools = [
  getResumeContextTool,
  analyzeJobTool,
  retrieveQuestionBankTool,
  fetchInterviewHistoryTool,
  generateQuestionTool,
];

/** 评估师 Agent 可用工具集 */
export const evaluatorTools = [
  fetchInterviewHistoryTool,
  getResumeContextTool,
  evaluateAnswerTool,
];

/** 简历解析 Agent 工具集 */
export const resumeParseTools = [parseResumeTool];
