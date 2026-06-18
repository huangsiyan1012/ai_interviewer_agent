import { query } from "../utils/db";

const DEFAULT_JOBS = [
  {
    id: "job-001",
    title: "前端开发",
    category: "技术",
    jd_text: "负责 Web 前端开发，熟悉 Vue/React、TypeScript、前端工程化。",
  },
  {
    id: "job-002",
    title: "Java后端",
    category: "技术",
    jd_text: "负责后端服务开发，熟悉 Java、Spring Boot、MySQL、微服务架构。",
  },
  {
    id: "job-003",
    title: "测试工程师",
    category: "技术",
    jd_text: "负责软件测试，熟悉功能测试、自动化测试、性能测试。",
  },
  {
    id: "job-004",
    title: "产品经理",
    category: "产品",
    jd_text: "负责产品规划与需求分析，具备用户调研、原型设计能力。",
  },
];

export async function seedJobs(): Promise<void> {
  for (const job of DEFAULT_JOBS) {
    await query(
      `INSERT INTO jobs (id, title, category, jd_text)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), category = VALUES(category), jd_text = VALUES(jd_text)`,
      [job.id, job.title, job.category, job.jd_text],
    );
  }
}
