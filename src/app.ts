import express from "express";
import cors from "cors";

import { env } from "./config/env";

import { healthRoutes } from "./routes/health.routes";
import { authRoutes } from "./routes/auth.routes";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  })
);

app.use(express.json());

app.use("/api/v1/health", healthRoutes);

app.use("/api/v1/auth", authRoutes);