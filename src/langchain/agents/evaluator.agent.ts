import { evaluationChain } from "../chains/evaluation.chain";
import { getInterviewHistory } from "../tools";
import type { EvaluationReportData } from "../../types/interview";

/**
 * 评估 Agent
 *
 * 流程：getInterviewHistory（Tool）→ evaluationChain（LLM，低温度）
 * 调用方：EvaluationWorkflow
 */
export async function invokeEvaluatorAgent(input: {
  sessionId: string;
  jobRole: string;
}): Promise<EvaluationReportData> {
  const qaRecords = await getInterviewHistory(input.sessionId, 50);
  return evaluationChain({
    jobRole: input.jobRole,
    qaRecords,
  });
}
