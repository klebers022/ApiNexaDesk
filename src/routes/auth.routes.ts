import { Router } from "express";

import { loginController } from "../controllers/auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", loginController);