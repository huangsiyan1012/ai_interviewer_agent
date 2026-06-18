export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface SessionGraphState {
  jobDescription?: string;
  jobKnowledge?: string;
  interviewEnded?: boolean;
  jobId?: string;
  currentQuestion?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
}
