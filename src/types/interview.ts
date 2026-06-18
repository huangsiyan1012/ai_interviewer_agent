/** 面试官 Agent 返回结构 */
export interface AgentResponse {
  action: "follow_up" | "next_question" | "phase_transition" | "end_interview";
  question: string;
  questionType: "technical" | "behavioral" | "project" | "open";
  difficulty: "easy" | "medium" | "hard";
  reasoning: string;
  targetSkill: string;
}

/** 首轮题目 */
export interface Question {
  content: string;
  questionType: AgentResponse["questionType"];
  difficulty: AgentResponse["difficulty"];
  targetSkill: string;
}

/** 评估报告（LLM 输出） */
export interface EvaluationReportData {
  overallScore: number;
  grade: string;
  dimensions: Array<{ name: string; score: number; comment: string }>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
}

/** Workflow 上下文 */
export interface InterviewContext {
  sessionId: string;
  resumeId: string;
  jobId: string;
  jobRole: string;
  resumeSummary: string;
  resumeSkills: string[];
  jobKnowledge: string;
  questionBankHints: string;
  historyText: string;
  currentRound: number;
  minRounds: number;
  maxRounds: number;
  lastAnswer?: string;
  lastQuestion?: string;
}
