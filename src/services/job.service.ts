import { getAllJobs, getJobById } from "../models/Job";

export class JobService {
  async listJobs() {
    return getAllJobs();
  }

  async getJob(id: string) {
    const job = await getJobById(id);
    if (!job) {
      throw new Error("岗位不存在");
    }
    return job;
  }
}

export const jobService = new JobService();
