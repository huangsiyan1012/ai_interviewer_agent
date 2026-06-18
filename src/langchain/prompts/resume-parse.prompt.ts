/** 简历解析 Prompt 模板 */
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

export function buildResumeParsePrompt(resumeText: string): string {
  // 控制长度，避免超出 token 限制
  const trimmed = resumeText.slice(0, 5000);
  return RESUME_PARSE_PROMPT.replace("{resumeText}", trimmed);
}
