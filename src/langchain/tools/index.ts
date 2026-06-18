import { getResumeById } from "../../models/Resum";
import { getRecordsBySessionId } from "../../models/InterviewRecord";
import {
  retrieveJobKnowledge,
  retrieveKnowledge,
  retrieveQuestionBank,
} from "../rag/retriever";

/** 获取简历结构化摘要 */
export async function getResumeContext(resumeId: string): Promise<string> {
  const resume = await getResumeById(resumeId);
  if (!resume?.parsed_data) return "暂无简历信息";
  const d = resume.parsed_data;
  return [
    `摘要：${d.summary ?? ""}`,
    `技能：${(d.skills ?? []).join("、")}`,
    `项目：${(d.projects ?? []).map((p: { name: string }) => p.name).join("、")}`,
  ].join("\n");
}

/** 获取格式化对话历史 */
export async function getInterviewHistory(
  sessionId: string,
  lastN = 10,
): Promise<string> {
  const records = await getRecordsBySessionId(sessionId);
  const recent = records.slice(-lastN);
  if (recent.length === 0) return "（尚无历史问答）";

  return recent
    .map((r) => {
      const q =
        typeof r.question === "object"
          ? r.question.content ?? JSON.stringify(r.question)
          : String(r.question);
      return `Q: ${q}\nA: ${r.answer}`;
    })
    .join("\n\n");
}

/** 检索岗位知识（Tool 封装） */
export async function searchJobKnowledge(
  jobId: string,
  _query?: string,
): Promise<string> {
  return retrieveJobKnowledge(jobId);
}

/** 检索题库（Tool 封装） */
export function searchQuestionBank(
  query: string,
  jobRole: string,
): Promise<string> {
  return Promise.resolve(retrieveQuestionBank(query, jobRole));
}

/** 检索 Markdown 知识库（RAG Tool 封装） */
export function searchKnowledgeBase(
  query: string,
  jobRole: string,
): Promise<string> {
  return Promise.resolve(retrieveKnowledge(query, jobRole));
}
