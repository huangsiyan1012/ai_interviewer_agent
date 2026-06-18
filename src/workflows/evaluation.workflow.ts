import { invokeEvaluatorAgent } from "../langchain/agents/evaluator.agent";
import { SessionMemoryManager } from "../langchain/memory/session.memory";
import type { EvaluationReportData } from "../types/interview";
import { BaseWorkflow } from "./base.workflow";

interface EvaluationInput {
  sessionId: string;
  jobRole: string;
}

/**
 * 评估 Workflow
 *
 * 步骤：invokeEvaluatorAgent（加载全部 QA → LLM 评分）→ 清理 Memory
 * 调用方：ReportService.generateReport
 */
export class EvaluationWorkflow extends BaseWorkflow<
  EvaluationInput,
  EvaluationReportData
> {
  constructor() {
    super("Evaluation");
  }

  protected async run(input: EvaluationInput): Promise<EvaluationReportData> {
    const report = await invokeEvaluatorAgent(input);
    SessionMemoryManager.clear(input.sessionId);
    return report;
  }
}

export const evaluationWorkflow = new EvaluationWorkflow();
