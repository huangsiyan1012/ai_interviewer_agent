/**
 * 简历 Service
 *
 * AI 路径：ResumeService → Resume Parse Agent → parse_resume Tool
 */
import fs from "fs";
import path from "path";
import config from "../config/config";
import { createCandidate } from "../models/Candidate";
import { createResume, getResumeById } from "../models/Resum";
import { runResumeParseAgent } from "../langchain/agents/resume-parse.agent";
import { extractResumeText } from "../utils/file-parser";
import { generateId } from "../utils/uuid";

export class ResumeService {
  async uploadResume(file: Express.Multer.File, userId: string) {
    const text = await extractResumeText(file.path, file.originalname);
    const parsedData = await runResumeParseAgent(text, generateId());

    return this.saveResume(
      file.path,
      file.originalname,
      file.mimetype,
      parsedData,
      userId,
    );
  }

  async uploadResumeFromText(content: string, userId: string) {
    const text = content.trim();
    if (!text) throw new Error("简历内容不能为空");

    const parsedData = await runResumeParseAgent(text, generateId());

    const fileName = `paste-${Date.now()}.txt`;
    const filePath = path.join(config.upload.dir, fileName);
    fs.writeFileSync(filePath, text, "utf-8");

    return this.saveResume(filePath, fileName, "text/plain", parsedData, userId);
  }

  private async saveResume(
    filePath: string,
    fileName: string,
    mimeType: string,
    parsedData: Awaited<ReturnType<typeof runResumeParseAgent>>,
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
