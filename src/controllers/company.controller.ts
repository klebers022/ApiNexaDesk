import type { Request, Response } from "express";
import { updateCompanySchema } from "../schemas/company.schema";
import { getCompany, updateCompany } from "../services/company.service";

export async function getCompanyController(request: Request, response: Response) {
  if (!request.user) return response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Usuário não autenticado." } });
  try { const company = await getCompany(request.user.companyId); if (!company) return response.status(404).json({ error: { code: "COMPANY_NOT_FOUND", message: "Empresa não encontrada." } }); return response.json({ data: company }); } catch (error) { console.error(error); return response.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Erro interno do servidor." } }); }
}

export async function updateCompanyController(request: Request, response: Response) {
  if (!request.user) return response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Usuário não autenticado." } });
  const parsed = updateCompanySchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Dados da empresa inválidos.", details: parsed.error.issues } });
  try { return response.json({ data: await updateCompany(request.user.companyId, parsed.data) }); } catch (error) { console.error(error); return response.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Erro interno do servidor." } }); }
}
