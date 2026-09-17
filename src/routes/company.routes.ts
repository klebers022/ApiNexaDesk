import { Router } from "express";
import { getCompanyController, updateCompanyController } from "../controllers/company.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
export const companyRoutes = Router();
companyRoutes.get("/me", authenticate, getCompanyController);
companyRoutes.put("/me", authenticate, authorize("ADMIN"), updateCompanyController);
