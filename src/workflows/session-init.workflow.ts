import { SessionMemoryManager } from "../langchain/memory/session.memory";
import { getResumeById } from "../models/Resum";
import { BaseWorkflow } from "./base.workflow";

interface SessionInitInput {
  sessionId: string;
  resumeId: string;
  jobRole: string;
}

interface SessionInitOutput {
  jobRole: string;
  resumeSummary: string;
}

/**
 * 会话初始化 Workflow
 *
 * 职责：创建空的 Memory 缓存，供后续追问时快速读写
 * 调用方：InterviewService.startInterview（在出题之前）
 */
export class SessionInitWorkflow extends BaseWorkflow<
  SessionInitInput,
  SessionInitOutput
> {
  constructor() {
    super("SessionInit");
  }

  protected async run(input: SessionInitInput): Promise<SessionInitOutput> {
    const resume = await getResumeById(input.resumeId);
    if (!resume) throw new Error("简历不存在");

    // 初始化内存对话缓存（与 DB graph_state 互补）
    SessionMemoryManager.init(input.sessionId);

    return {
      jobRole: input.jobRole,
      resumeSummary: resume.parsed_data?.summary ?? "",
    };
  }
}

export const sessionInitWorkflow = new SessionInitWorkflow();
