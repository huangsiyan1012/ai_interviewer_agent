/** 评估 Prompt */
export const EVALUATION_PROMPT = `你是面试评估专家。根据以下完整面试记录，对候选人进行客观评估。

## 岗位
{jobRole}

## 面试问答记录
{qaRecords}

从以下维度评估（专业知识30%、项目经验25%、问题解决20%、沟通表达15%、岗位匹配10%），返回 JSON：
{
  "overallScore": 0-100,
  "grade": "A|B+|B|C",
  "dimensions": [{"name": "维度名", "score": 0-100, "comment": "评语"}],
  "strengths": ["优势1"],
  "weaknesses": ["不足1"],
  "suggestions": ["建议1"],
  "summary": "综合评价"
}`;

export function buildEvaluationPrompt(ctx: {
  jobRole: string;
  qaRecords: string;
}): string {
  return EVALUATION_PROMPT.replace("{jobRole}", ctx.jobRole).replace(
    "{qaRecords}",
    ctx.qaRecords,
  );
}
