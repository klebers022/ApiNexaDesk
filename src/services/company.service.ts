import { pool } from "../database/connection";
import type { UpdateCompanyInput } from "../schemas/company.schema";

type CompanyRow = { id: string; name: string; created_at: Date; updated_at: Date };
const mapCompany = (company: CompanyRow) => ({ id: company.id, name: company.name, createdAt: company.created_at, updatedAt: company.updated_at });

export async function getCompany(companyId: string) {
  const result = await pool.query<CompanyRow>("SELECT id, name, created_at, updated_at FROM companies WHERE id = $1 LIMIT 1", [companyId]);
  return result.rows[0] ? mapCompany(result.rows[0]) : null;
}

export async function updateCompany(companyId: string, input: UpdateCompanyInput) {
  const result = await pool.query<CompanyRow>("UPDATE companies SET name = $1 WHERE id = $2 RETURNING id, name, created_at, updated_at", [input.name, companyId]);
  if (!result.rows[0]) throw new Error("COMPANY_NOT_FOUND");
  return mapCompany(result.rows[0]);
}
