import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { createArticleController, listArticlesController, setArticleStatusController } from "../controllers/article.controller";
export const articleRoutes=Router();
articleRoutes.get("/",authenticate,authorize("COMPANY_ADMIN","ANALYST","REQUESTER"),listArticlesController);
articleRoutes.post("/",authenticate,authorize("COMPANY_ADMIN"),createArticleController);
articleRoutes.patch("/:id/status",authenticate,authorize("COMPANY_ADMIN"),setArticleStatusController);
