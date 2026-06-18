/** LLM 解析后的岗位信息 */
export interface ParsedJob {
  title: string;
  category: string;
  requirements: string;
  keySkills: string[];
}

/** 格式化为 Prompt 可用的岗位知识文本 */
export function formatJobKnowledge(job: ParsedJob): string {
  return [
    `岗位：${job.title}`,
    `类别：${job.category}`,
    `核心要求：${job.requirements}`,
    `关键技能：${job.keySkills.join("、") || "暂无"}`,
  ].join("\n");
}
