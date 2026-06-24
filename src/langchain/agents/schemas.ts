import { z } from "zod";

/** 面试官 Agent 最终决策（structured output） */
export const InterviewerDecisionSchema = z.object({
  action: z.enum(["follow_up", "next_question", "end_interview"]),
  question: z.string(),
  questionType: z.enum(["technical", "behavioral", "project", "open"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  reasoning: z.string(),
  targetSkill: z.string(),
});

export type InterviewerDecision = z.infer<typeof InterviewerDecisionSchema>;

/** 评估师 Agent 最终输出 */
export const EvaluationReportSchema = z.object({
  overallScore: z.number(),
  grade: z.string(),
  dimensions: z.array(
    z.object({
      name: z.string(),
      score: z.number(),
      comment: z.string(),
    }),
  ),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  summary: z.string(),
});

export type EvaluationReportOutput = z.infer<typeof EvaluationReportSchema>;

/** Agent 单步日志 — 写入 graph_state.toolExecutionHistory */
export interface AgentStepLog {
  action: "tool_call" | "observation" | "final_answer";
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  reasoning?: string;
  timestamp: string;
}
