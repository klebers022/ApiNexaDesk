import { Router } from "express";

import {
  addTeamMemberController,
  createTeamController,
  deleteTeamController,
  getTeamByIdController,
  listTeamMembersController,
  listTeamsController,
  removeTeamMemberController,
  updateTeamController,
} from "../controllers/team.controller";

import { authenticate } from "../middlewares/authenticate";

import { authorize } from "../middlewares/authorize";

export const teamRoutes = Router();

// Leitura
teamRoutes.get(
  "/",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST"),
  listTeamsController,
);

teamRoutes.get(
  "/:id",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST"),
  getTeamByIdController,
);

teamRoutes.get(
  "/:id/members",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST"),
  listTeamMembersController,
);

// Administração
teamRoutes.post("/", authenticate, authorize("COMPANY_ADMIN"), createTeamController);

teamRoutes.put("/:id", authenticate, authorize("COMPANY_ADMIN"), updateTeamController);

teamRoutes.post(
  "/:id/members",
  authenticate,
  authorize("COMPANY_ADMIN"),
  addTeamMemberController,
);

teamRoutes.delete(
  "/:id/members/:userId",
  authenticate,
  authorize("COMPANY_ADMIN"),
  removeTeamMemberController,
);

teamRoutes.delete(
  "/:id",
  authenticate,
  authorize("COMPANY_ADMIN"),
  deleteTeamController,
);
