/**
 * 出题 Prompt
 *
 * generate_question Tool 调用时，把简历/JD/题库/RAG 等信息
 * 全部塞进这个模板，让 LLM 生成一道合适的面试题。
 */
export const QUESTION_PROMPT = `你是资深技术面试官，正在对候选人进行「{jobRole}」岗位的模拟面试。

## 候选人简历摘要
{resumeSummary}

## 技能
{resumeSkills}

## 岗位 JD 要点
{jobKnowledge}

## 参考面试题
{questionBankHints}

## 知识库参考（RAG 检索）
{knowledgeHints}

请生成第一个面试问题（通常是自我介绍或破冰），返回 JSON：
{
  "content": "问题内容",
  "questionType": "technical|behavioral|project|open",
  "difficulty": "easy|medium|hard",
  "targetSkill": "考察的技能点"
}`;

export function buildQuestionPrompt(ctx: {
  jobRole: string;
  resumeSummary: string;
  resumeSkills: string[];
  jobKnowledge: string;
  questionBankHints: string;
  knowledgeHints: string;
}): string {
  return QUESTION_PROMPT.replace("{jobRole}", ctx.jobRole)
    .replace("{resumeSummary}", ctx.resumeSummary)
    .replace("{resumeSkills}", ctx.resumeSkills.join("、") || "暂无")
    .replace("{jobKnowledge}", ctx.jobKnowledge)
    .replace("{questionBankHints}", ctx.questionBankHints)
    .replace("{knowledgeHints}", ctx.knowledgeHints);
}
