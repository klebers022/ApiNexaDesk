import { Router } from "express";
import {
  chatController,
  searchSolutionsController,
  triageController,
} from "../controllers/ai.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

export const aiRoutes = Router();

// ======================================================
// TRIAGE
// ======================================================

aiRoutes.post(
  "/triage",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST", "REQUESTER"),
  triageController
);

// ======================================================
// SOLUTIONS (RAG / BASE HISTÓRICA)
// ======================================================

aiRoutes.post(
  "/solutions",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST", "REQUESTER"),
  searchSolutionsController
);

// ======================================================
// CHAT INTERATIVO
// ======================================================

aiRoutes.post(
  "/chat",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST", "REQUESTER"),
  chatController
);
