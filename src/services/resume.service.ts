/**
 * 简历 Service — 业务层
 *
 * 完整路径（以粘贴文字为例）：
 *   uploadResumeFromText
 *     → runResumeParseAgent（AI Agent）
 *         → parse_resume Tool（内部调 LLM）
 *     → saveResume（写 MySQL）
 *
 * Service 自己不直接调 LLM，所有 AI 工作交给 Agent。
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
  /**
   * 文件上传模式：PDF / Word / TXT
   * ① 从文件提取纯文本  ② Agent 解析  ③ 存库
   */
  async uploadResume(file: Express.Multer.File, userId: string) {
    // file.path = Multer 保存到 uploads/ 目录后的绝对路径
    const text = await extractResumeText(file.path, file.originalname);

    // 把纯文本交给 Resume Parse Agent 做结构化解析
    const parsedData = await runResumeParseAgent(text, generateId());

    return this.saveResume(
      file.path,
      file.originalname,
      file.mimetype,
      parsedData,
      userId,
    );
  }

  /**
   * 文字粘贴模式：用户直接在 textarea 里输入简历
   * ① 校验非空  ② Agent 解析  ③ 把原文存成 .txt  ④ 存库
   */
  async uploadResumeFromText(content: string, userId: string) {
    const text = content.trim();
    if (!text) throw new Error("简历内容不能为空");

    const parsedData = await runResumeParseAgent(text, generateId());

    // 即使粘贴模式，也落一份 txt 到 uploads/，保持和文件上传一致
    const fileName = `paste-${Date.now()}.txt`;
    const filePath = path.join(config.upload.dir, fileName);
    fs.writeFileSync(filePath, text, "utf-8");

    return this.saveResume(filePath, fileName, "text/plain", parsedData, userId);
  }

  /**
   * 把解析结果写入数据库，并返回前端需要的摘要信息
   */
  private async saveResume(
    filePath: string,
    fileName: string,
    mimeType: string,
    parsedData: Awaited<ReturnType<typeof runResumeParseAgent>>,
    userId: string,
  ) {
    const candidateId = generateId(); // 候选人 ID（关联登录用户）
    const resumeId = generateId(); // 简历 ID

    // 一个用户对应一个 candidate 记录（本次上传新建）
    await createCandidate(candidateId, userId);

    // parsed_data 就是 Agent 解析出的 JSON（summary/skills/projects/experience）
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
