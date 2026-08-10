import { Router } from "express";

import {
  getUserByIdController,
  listUsersController,
} from "../controllers/user.controller";

import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

export const userRoutes = Router();

userRoutes.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  listUsersController
);

userRoutes.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getUserByIdController
);