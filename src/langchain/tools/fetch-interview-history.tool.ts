import { tool } from "langchain";
import { z } from "zod";
import { getRecordsBySessionId } from "../../models/InterviewRecord";
import { getAgentContext } from "./agent-context";

/** 获取当前面试会话的历史问答记录 */
export const fetchInterviewHistoryTool = tool(
  async ({ session_id, last_n }) => {
    const ctx = getAgentContext();
    const sid = session_id || ctx.sessionId;
    if (!sid) return JSON.stringify({ history: "（尚无历史问答）", records: [] });

    const records = await getRecordsBySessionId(sid);
    const recent = records.slice(-(last_n ?? 10));

    if (recent.length === 0) {
      return JSON.stringify({ history: "（尚无历史问答）", records: [] });
    }

    const history = recent
      .map((r) => {
        const q =
          typeof r.question === "object"
            ? r.question.content ?? JSON.stringify(r.question)
            : String(r.question);
        return `Q: ${q}\nA: ${r.answer}`;
      })
      .join("\n\n");

    return JSON.stringify({ history, recordCount: recent.length });
  },
  {
    name: "fetch_interview_history",
    description: "获取当前面试会话的历史问答，用于决定追问或换题",
    schema: z.object({
      session_id: z.string().optional().describe("会话 ID，省略则使用当前会话"),
      last_n: z.number().optional().describe("最近 N 轮记录，默认 10"),
    }),
  },
);
