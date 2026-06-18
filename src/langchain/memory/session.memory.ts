/** 会话级 Memory（内存缓存，重启后从 DB 恢复） */
const buffer = new Map<
  string,
  Array<{ role: "user" | "assistant"; content: string }>
>();

export class SessionMemoryManager {
  static init(
    sessionId: string,
    messages: Array<{ role: "user" | "assistant"; content: string }> = [],
  ) {
    buffer.set(sessionId, [...messages]);
  }

  static getMessages(sessionId: string) {
    return buffer.get(sessionId) ?? [];
  }

  static addAI(sessionId: string, content: string) {
    const list = buffer.get(sessionId) ?? [];
    list.push({ role: "assistant", content });
    buffer.set(sessionId, list);
  }

  static addUser(sessionId: string, content: string) {
    const list = buffer.get(sessionId) ?? [];
    list.push({ role: "user", content });
    buffer.set(sessionId, list);
  }

  static toText(sessionId: string, lastN = 10): string {
    const list = buffer.get(sessionId) ?? [];
    return list
      .slice(-lastN)
      .map((m) => `${m.role === "user" ? "候选人" : "面试官"}: ${m.content}`)
      .join("\n");
  }

  static clear(sessionId: string) {
    buffer.delete(sessionId);
  }
}
