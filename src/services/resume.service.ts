/**
 * 简历 Service
 *
 * 职责：接收文件/文字 → 调 Workflow 解析 → 写入 DB
 * 调用链：Controller → ResumeService → ResumeParseWorkflow → parseResumeChain
 */
import fs from "fs";
import path from "path";
import config from "../config/config";
import { createCandidate } from "../models/Candidate";
import { createResume, getResumeById } from "../models/Resum";
import { parseResumeChain } from "../langchain/chains/resume-parse.chain";
import { resumeParseWorkflow } from "../workflows/resume-parse.workflow";
import { generateId } from "../utils/uuid";

export class ResumeService {
  /** 文件上传：Workflow 负责「提取文本 + LLM 解析」 */
  async uploadResume(file: Express.Multer.File, userId: string) {
    const parsedData = await resumeParseWorkflow.execute({
      filePath: file.path,
      fileName: file.originalname,
    });

    return this.saveResume(
      file.path,
      file.originalname,
      file.mimetype,
      parsedData,
      userId,
    );
  }

  /** 文字粘贴：跳过文件提取，直接调 Chain */
  async uploadResumeFromText(content: string, userId: string) {
    const text = content.trim();
    if (!text) throw new Error("简历内容不能为空");

    const parsedData = await parseResumeChain(text);

    const fileName = `paste-${Date.now()}.txt`;
    const filePath = path.join(config.upload.dir, fileName);
    fs.writeFileSync(filePath, text, "utf-8");

    return this.saveResume(filePath, fileName, "text/plain", parsedData, userId);
  }

  /** 把解析结果关联到当前登录用户，写入 DB */
  private async saveResume(
    filePath: string,
    fileName: string,
    mimeType: string,
    parsedData: Awaited<ReturnType<typeof parseResumeChain>>,
    userId: string,
  ) {
    const candidateId = generateId();
    const resumeId = generateId();

    await createCandidate(candidateId, userId);
    await createResume(
      resumeId,
      candidateId,
      filePath,
      fileName,
      mimeType,
      parsedData,
    );

    const resume = await getResumeById(resumeId);
    return {
      resumeId,
      candidateId,
      parsedSummary: resume?.parsed_data?.summary ?? "",
      skills: resume?.parsed_data?.skills ?? [],
    };
  }

  async getResume(id: string) {
    const resume = await getResumeById(id);
    if (!resume) {
      throw new Error("简历不存在");
    }
    return resume;
  }

  async deleteResume(id: string) {
    const resume = await getResumeById(id);
    if (!resume) {
      throw new Error("简历不存在");
    }
    if (fs.existsSync(resume.file_path)) {
      fs.unlinkSync(resume.file_path);
    }
    return { deleted: true };
  }
}

export const resumeService = new ResumeService();
