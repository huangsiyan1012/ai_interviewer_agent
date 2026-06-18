/** 追问 Prompt */
export const FOLLOW_UP_PROMPT = `你是资深技术面试官，正在对「{jobRole}」岗位进行模拟面试。

## 简历摘要
{resumeSummary}

## 岗位 JD
{jobKnowledge}

## 知识库参考（RAG 检索）
{knowledgeHints}

## 对话历史
{historyText}

## 当前轮次
第 {currentRound} 轮（至少 {minRounds} 轮，最多 {maxRounds} 轮）

## 上一题
{lastQuestion}

## 候选人回答
{lastAnswer}

根据回答决定下一步，返回 JSON：
{
  "action": "follow_up|next_question|phase_transition|end_interview",
  "question": "下一个问题（action 为 end_interview 时可简短总结）",
  "questionType": "technical|behavioral|project|open",
  "difficulty": "easy|medium|hard",
  "reasoning": "出题理由",
  "targetSkill": "考察技能点"
}

规则：
- 回答模糊/过短 → follow_up
- 回答较好未深挖 → follow_up
- 话题已充分 → next_question
- 核心技能点已充分考察、可以收尾时 → end_interview（至少 {minRounds} 轮后才可结束）
- 不要机械凑轮次，根据考察充分度灵活决定`;

export function buildFollowUpPrompt(ctx: {
  jobRole: string;
  resumeSummary: string;
  jobKnowledge: string;
  knowledgeHints: string;
  historyText: string;
  currentRound: number;
  minRounds: number;
  maxRounds: number;
  lastQuestion: string;
  lastAnswer: string;
}): string {
  return FOLLOW_UP_PROMPT.replace("{jobRole}", ctx.jobRole)
    .replace("{resumeSummary}", ctx.resumeSummary)
    .replace("{jobKnowledge}", ctx.jobKnowledge)
    .replace("{knowledgeHints}", ctx.knowledgeHints)
    .replace("{historyText}", ctx.historyText)
    .replace(/\{currentRound\}/g, String(ctx.currentRound))
    .replace(/\{minRounds\}/g, String(ctx.minRounds))
    .replace(/\{maxRounds\}/g, String(ctx.maxRounds))
    .replace("{lastQuestion}", ctx.lastQuestion)
    .replace("{lastAnswer}", ctx.lastAnswer);
}
