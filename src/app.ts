import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env";

// ======================================================
// ROUTES
// ======================================================

import { healthRoutes } from "./routes/health.routes";

import { authRoutes } from "./routes/auth.routes";

import { userRoutes } from "./routes/user.routes";

import { customerRoutes } from "./routes/customer.routes";

import { categoryRoutes } from "./routes/category.routes";

import { teamRoutes } from "./routes/team.routes";

import { ticketRoutes } from "./routes/ticket.routes";

import { notificationRoutes } from "./routes/notification.routes";

import path from "path";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { companyRoutes } from "./routes/company.routes";
import { platformRoutes } from "./routes/platform.routes";
import { aiRoutes } from "./routes/ai.routes";
import { articleRoutes } from "./routes/article.routes";

// ======================================================
// MIDDLEWARES
// ======================================================

import { apiRateLimiter, authRateLimiter } from "./middlewares/rateLimiter";

import { notFound } from "./middlewares/notFound";

import { errorHandler } from "./middlewares/errorHandler";

// ======================================================
// APP
// ======================================================

export const app = express();

// ======================================================
// EXPRESS CONFIG
// ======================================================

app.disable("x-powered-by");

// ======================================================
// SECURITY HEADERS
// ======================================================

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ======================================================
// CORS
// ======================================================

const allowedOrigins = env.FRONTEND_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Postman, Insomnia,
      // server-to-server etc.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS_NOT_ALLOWED"));
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ======================================================
// BODY
// ======================================================

app.use(
  express.json({
    limit: "1mb",
  }),
);

// ======================================================
// RATE LIMIT
// ======================================================

app.use("/api/v1", apiRateLimiter);

// ======================================================
// HEALTH
// ======================================================

app.use("/api/v1/health", healthRoutes);

// ======================================================
// AUTH
// ======================================================

app.use("/api/v1/auth", authRateLimiter, authRoutes);

// ======================================================
// USERS
// ======================================================

app.use("/api/v1/users", userRoutes);

// ======================================================
// CUSTOMERS
// ======================================================

app.use("/api/v1/customers", customerRoutes);

// ======================================================
// CATEGORIES
// ======================================================

app.use("/api/v1/categories", categoryRoutes);

// ======================================================
// TEAMS
// ======================================================

app.use("/api/v1/teams", teamRoutes);

// ======================================================
// TICKETS
// ======================================================

app.use("/api/v1/tickets", ticketRoutes);

// ======================================================
// NOTIFICATIONS
// ======================================================

app.use("/api/v1/notifications", notificationRoutes);

// ======================================================
// DASHBOARD
// ======================================================

app.use("/api/v1/dashboard", dashboardRoutes);

app.use("/api/v1/companies", companyRoutes);
app.use("/api/v1/platform", platformRoutes);

// ======================================================
// AI CHATBOT & KNOWLEDGE
// ======================================================

app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/knowledge-articles", articleRoutes);

// ======================================================
// STATIC CHATBOT DEMO WIDGET
// ======================================================

app.use("/chatbot", express.static(path.join(__dirname, "../public/chatbot")));

// ======================================================
// 404
// Deve ficar DEPOIS das rotas.
// ======================================================

app.use(notFound);

// ======================================================
// GLOBAL ERROR HANDLER
// Deve ser sempre o último middleware.
// ======================================================

app.use(errorHandler);
