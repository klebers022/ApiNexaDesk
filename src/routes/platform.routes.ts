import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { createPlatformCompanyController, listPlatformCompaniesController } from "../controllers/platform.controller";
export const platformRoutes = Router();
platformRoutes.get("/companies", authenticate, authorize("SUPER_ADMIN"), listPlatformCompaniesController);
platformRoutes.post("/companies", authenticate, authorize("SUPER_ADMIN"), createPlatformCompanyController);
