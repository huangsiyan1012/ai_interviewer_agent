// backend/src/app.ts
import cors from "cors";
import express from "express";
import config from "./config/config";
import { errorHandler } from "./middleware/error-handler";
import interviewRoutes from "./routes/interview.routes";
import authRoutes from "./routes/auth.routes";
import jobRoutes from "./routes/job.routes";
import reportRoutes from "./routes/report.routes";
import resumeRoutes from "./routes/resume.routes";
import voiceRoutes from "./routes/voice.routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(config.upload.dir));

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/voice", voiceRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "后端服务运行正常",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

export default app;
