import type {
  AgentResponse,
  EvaluationReportData,
  Question,
} from "../../types/interview";

function extractJson(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("LLM 返回内容中未找到 JSON");
  return JSON.parse(match[0]);
}

export function parseQuestionJson(raw: string): Question {
  const data = extractJson(raw);
  return {
    content: String(data.content ?? data.question ?? ""),
    questionType: (data.questionType as Question["questionType"]) ?? "open",
    difficulty: (data.difficulty as Question["difficulty"]) ?? "medium",
    targetSkill: String(data.targetSkill ?? ""),
  };
}

export function parseAgentResponseJson(raw: string): AgentResponse {
  const data = extractJson(raw);
  return {
    action: (data.action as AgentResponse["action"]) ?? "next_question",
    question: String(data.question ?? ""),
    questionType: (data.questionType as AgentResponse["questionType"]) ?? "open",
    difficulty: (data.difficulty as AgentResponse["difficulty"]) ?? "medium",
    reasoning: String(data.reasoning ?? ""),
    targetSkill: String(data.targetSkill ?? ""),
  };
}

export function parseEvaluationJson(raw: string): EvaluationReportData {
  const data = extractJson(raw);
  return {
    overallScore: Number(data.overallScore ?? 70),
    grade: String(data.grade ?? "B"),
    dimensions: Array.isArray(data.dimensions)
      ? data.dimensions.map((d: Record<string, unknown>) => ({
          name: String(d.name ?? ""),
          score: Number(d.score ?? 70),
          comment: String(d.comment ?? ""),
        }))
      : [],
    strengths: Array.isArray(data.strengths)
      ? data.strengths.map(String)
      : [],
    weaknesses: Array.isArray(data.weaknesses)
      ? data.weaknesses.map(String)
      : [],
    suggestions: Array.isArray(data.suggestions)
      ? data.suggestions.map(String)
      : [],
    summary: String(data.summary ?? ""),
  };
}
