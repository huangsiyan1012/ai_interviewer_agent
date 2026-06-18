import { generateQuestionChain } from "../langchain/chains/question.chain";
import { buildQuestionContext } from "../langchain/agents/interviewer.agent";
import { SessionMemoryManager } from "../langchain/memory/session.memory";
import type { Question } from "../types/interview";
import { BaseWorkflow } from "./base.workflow";

interface QuestionGenerateInput {
  sessionId: string;
  resumeId: string;
  jobRole: string;
  jobKnowledge: string;
}

/**
 * 首轮出题 Workflow
 *
 * 步骤：
 *   1. buildQuestionContext（Agent：调 Tools 收集简历/题库）
 *   2. generateQuestionChain（Chain：LLM 生成第一题）
 *   3. 写入 Memory
 *
 * 调用方：InterviewService.startInterview
 */
export class QuestionGenerateWorkflow extends BaseWorkflow<
  QuestionGenerateInput,
  Question
> {
  constructor() {
    super("QuestionGenerate");
  }

  protected async run(input: QuestionGenerateInput): Promise<Question> {
    // Agent 层：收集 Prompt 所需的上下文
    const ctx = await buildQuestionContext({
      resumeId: input.resumeId,
      jobRole: input.jobRole,
      jobKnowledge: input.jobKnowledge,
    });

    // Chain 层：LLM 生成题目
    const question = await generateQuestionChain({
      jobRole: input.jobRole,
      ...ctx,
    });

    SessionMemoryManager.addAI(input.sessionId, question.content);
    return question;
  }
}

export const questionGenerateWorkflow = new QuestionGenerateWorkflow();
