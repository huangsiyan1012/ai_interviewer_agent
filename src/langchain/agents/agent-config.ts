/**
 * Agent 运行配置
 *
 * LangGraph（Agent 底层引擎）有一个「递归步数上限」recursionLimit，
 * 默认 25。Agent 每做一次「LLM 思考 → 调 Tool → 拿结果」算多步，
 * 步数用尽会报错。这里统一提高到 40（可在 .env 配置）。
 */
import config from "../../config/config";

export function getAgentInvokeConfig() {
  return {
    recursionLimit: config.agent.recursionLimit, // 默认 40
  };
}
