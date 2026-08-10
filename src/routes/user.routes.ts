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

userRoutes.get("/", authenticate, authorize("ADMIN"), listUsersController);

userRoutes.get("/:id", authenticate, authorize("ADMIN"), getUserByIdController);

userRoutes.post("/", authenticate, authorize("ADMIN"), createUserController);

userRoutes.put("/:id", authenticate, authorize("ADMIN"), updateUserController);

userRoutes.delete("/:id", authenticate, authorize("ADMIN"), deactivateUserController);
