import express from "express";
import cors from "cors";
import { userRoutes } from "./routes/user.routes";

import { env } from "./config/env";

import { healthRoutes } from "./routes/health.routes";
import { authRoutes } from "./routes/auth.routes";
import { customerRoutes } from "./routes/customer.routes";
import { categoryRoutes } from "./routes/category.routes";
import { teamRoutes } from "./routes/team.routes";
import { ticketRoutes } from "./routes/ticket.routes";

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
  }),
);

app.use(express.json());

app.use("/api/v1/health", healthRoutes);

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/customers", customerRoutes);

app.use("/api/v1/categories", categoryRoutes);

app.use("/api/v1/teams", teamRoutes);

app.use("/api/v1/tickets", ticketRoutes);
