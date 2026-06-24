/**
 * 会话内存管理器
 *
 * 为什么需要它？
 *   graph_state 存在 MySQL，每次读写有延迟；
 *   内存 Map 做热缓存，同一会话内快速读写对话历史。
 *
 * 注意：服务重启后内存清空，需从 graph_state.messages 恢复（见 restoreMemory）。
 */
const buffer = new Map<
  string,
  Array<{ role: "user" | "assistant"; content: string }>
>();

export class SessionMemoryManager {
  /** 初始化或恢复一个会话的消息列表 */
  static init(
    sessionId: string,
    messages: Array<{ role: "user" | "assistant"; content: string }> = [],
  ) {
    buffer.set(sessionId, [...messages]);
  }

  static getMessages(sessionId: string) {
    return buffer.get(sessionId) ?? [];
  }

  /** 追加 AI（面试官）消息 */
  static addAI(sessionId: string, content: string) {
    const list = buffer.get(sessionId) ?? [];
    list.push({ role: "assistant", content });
    buffer.set(sessionId, list);
  }

  /** 追加用户（候选人）消息 */
  static addUser(sessionId: string, content: string) {
    const list = buffer.get(sessionId) ?? [];
    list.push({ role: "user", content });
    buffer.set(sessionId, list);
  }

  /** 格式化为「面试官: ... 候选人: ...」文本，供 Tool 或 Prompt 使用 */
  static toText(sessionId: string, lastN = 10): string {
    const list = buffer.get(sessionId) ?? [];
    return list
      .slice(-lastN)
      .map((m) => `${m.role === "user" ? "候选人" : "面试官"}: ${m.content}`)
      .join("\n");
  }

  /** 面试结束生成报告后清理 */
  static clear(sessionId: string) {
    buffer.delete(sessionId);
  }
}
