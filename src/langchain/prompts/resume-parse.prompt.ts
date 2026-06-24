/**
 * 简历解析 Prompt 模板
 *
 * Prompt = 发给 LLM 的「说明书」，告诉它要做什么、输出什么格式。
 * {resumeText} 是占位符，buildResumeParsePrompt 会替换成真实简历内容。
 */
export const RESUME_PARSE_PROMPT = `你是简历解析助手。请从下面的简历文本中提取信息，只返回 JSON，不要其他说明。

JSON 格式：
{
  "summary": "200字以内的候选人摘要",
  "skills": ["技能1", "技能2"],
  "projects": [{"name": "项目名", "description": "项目简介"}],
  "experience": [{"company": "公司名", "role": "职位", "duration": "时间段"}]
}

简历文本：
---
{resumeText}
---`;

/** 把模板里的 {resumeText} 替换成真实简历，并截断到 5000 字防止超 token */
export function buildResumeParsePrompt(resumeText: string): string {
  const trimmed = resumeText.slice(0, 5000);
  return RESUME_PARSE_PROMPT.replace("{resumeText}", trimmed);
}
