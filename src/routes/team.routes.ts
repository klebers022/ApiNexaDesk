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
  authorize("ADMIN", "AGENT"),
  listTeamsController,
);

teamRoutes.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "AGENT"),
  getTeamByIdController,
);

teamRoutes.get(
  "/:id/members",
  authenticate,
  authorize("ADMIN", "AGENT"),
  listTeamMembersController,
);

// Administração
teamRoutes.post("/", authenticate, authorize("ADMIN"), createTeamController);

teamRoutes.put("/:id", authenticate, authorize("ADMIN"), updateTeamController);

teamRoutes.post(
  "/:id/members",
  authenticate,
  authorize("ADMIN"),
  addTeamMemberController,
);

teamRoutes.delete(
  "/:id/members/:userId",
  authenticate,
  authorize("ADMIN"),
  removeTeamMemberController,
);

teamRoutes.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteTeamController,
);
