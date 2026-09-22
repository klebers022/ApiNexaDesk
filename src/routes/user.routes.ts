import { Router } from "express";

import {
  createUserController,
  getUserByIdController,
  listUsersController,
  updateUserController,
  deactivateUserController,
} from "../controllers/user.controller";

import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

export const userRoutes = Router();

userRoutes.get("/", authenticate, authorize("COMPANY_ADMIN"), listUsersController);

userRoutes.get("/:id", authenticate, authorize("COMPANY_ADMIN"), getUserByIdController);

userRoutes.post("/", authenticate, authorize("COMPANY_ADMIN"), createUserController);

userRoutes.put("/:id", authenticate, authorize("COMPANY_ADMIN"), updateUserController);

userRoutes.delete("/:id", authenticate, authorize("COMPANY_ADMIN"), deactivateUserController);
