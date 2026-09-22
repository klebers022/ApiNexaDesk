import { Request, Response } from "express";
import { articleSchema, articleStatusSchema } from "../schemas/knowledge.schema";
import { createArticle, listArticles, setArticleStatus } from "../services/article.service";

export async function listArticlesController(req: Request, res: Response) {
  return res.json({ data: await listArticles(req.user!.companyId, req.user!.role === "REQUESTER") });
}
export async function createArticleController(req: Request, res: Response) {
  const parsed=articleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({error:{code:"VALIDATION_ERROR",message:"Artigo inválido.",details:parsed.error.issues}});
  return res.status(201).json({data:await createArticle(req.user!.companyId,req.user!.id,parsed.data)});
}
export async function setArticleStatusController(req: Request, res: Response) {
  const parsed=articleStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({error:{code:"VALIDATION_ERROR",message:"Status inválido."}});
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const article=await setArticleStatus(req.user!.companyId,req.user!.id,id,parsed.data.status);
  if (!article) return res.status(404).json({error:{code:"ARTICLE_NOT_FOUND",message:"Artigo não encontrado."}});
  return res.json({data:article});
}
