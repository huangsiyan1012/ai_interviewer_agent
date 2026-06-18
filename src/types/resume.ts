/** 简历解析后的结构化数据 */
export interface ParsedResume {
  summary: string;
  skills: string[];
  projects: Array<{ name: string; description: string }>;
  experience: Array<{ company: string; role: string; duration: string }>;
}
