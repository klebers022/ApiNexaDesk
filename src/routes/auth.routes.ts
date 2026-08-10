import { Router } from "express";

import {
  loginController,
  meController,
} from "../controllers/auth.controller";

import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

export const authRoutes = Router();

authRoutes.post("/login", loginController);

authRoutes.get(
  "/me",
  authenticate,
  meController
);
