import { parseResumeChain } from "../langchain/chains/resume-parse.chain";
import type { ParsedResume } from "../types/resume";
import { extractResumeText } from "../utils/file-parser";
import { BaseWorkflow } from "./base.workflow";

interface ResumeParseInput {
  filePath: string;
  fileName: string;
}

/**
 * 简历解析 Workflow
 *
 * 步骤：extractResumeText（PDF/Word/TXT）→ parseResumeChain（LLM）
 * 调用方：ResumeService.uploadResume
 */
export class ResumeParseWorkflow extends BaseWorkflow<
  ResumeParseInput,
  ParsedResume
> {
  constructor() {
    super("ResumeParse");
  }

  protected async run(input: ResumeParseInput): Promise<ParsedResume> {
    const text = await extractResumeText(input.filePath, input.fileName);
    return parseResumeChain(text);
  }
}

export const resumeParseWorkflow = new ResumeParseWorkflow();
