/** 岗位分析 Prompt */
export const JOB_ANALYZE_PROMPT = `你是招聘分析助手。用户会描述一个目标岗位（可能是岗位名称、JD 片段或自己的理解），请分析并返回 JSON，不要其他说明。

JSON 格式：
{
  "title": "标准化岗位名称，如「前端开发工程师」",
  "category": "岗位类别，如「技术」「产品」「设计」",
  "requirements": "100字以内的核心任职要求摘要",
  "keySkills": ["关键技能1", "关键技能2"]
}

用户描述的岗位：
---
{jobDescription}
---`;

export function buildJobAnalyzePrompt(jobDescription: string): string {
  return JOB_ANALYZE_PROMPT.replace(
    "{jobDescription}",
    jobDescription.slice(0, 2000),
  );
}
