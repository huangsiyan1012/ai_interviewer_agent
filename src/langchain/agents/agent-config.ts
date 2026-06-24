import config from "../../config/config";

/** Agent invoke 通用配置：提高 recursionLimit，避免多 tool 场景误触上限 */
export function getAgentInvokeConfig() {
  return {
    recursionLimit: config.agent.recursionLimit,
  };
}
