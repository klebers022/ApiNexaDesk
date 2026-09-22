import bcrypt from "bcrypt";
import { pool } from "../database/connection";
import type { CreatePlatformCompanyInput } from "../schemas/company.schema";

export async function listPlatformCompanies() {
  const result = await pool.query(`SELECT c.id, c.legal_name, c.trade_name, c.document, c.email, c.phone, c.status, u.name AS primary_admin_name, COUNT(DISTINCT usr.id)::int AS user_count, COUNT(DISTINCT t.id)::int AS team_count, COUNT(DISTINCT tk.id) FILTER (WHERE tk.status NOT IN ('RESOLVED','CLOSED'))::int AS open_ticket_count FROM companies c LEFT JOIN users u ON u.id = c.primary_admin_id LEFT JOIN users usr ON usr.company_id = c.id LEFT JOIN teams t ON t.company_id = c.id LEFT JOIN tickets tk ON tk.company_id = c.id GROUP BY c.id, u.name ORDER BY c.created_at DESC`);
  return result.rows.map((row) => ({ id: row.id, legalName: row.legal_name, tradeName: row.trade_name, document: row.document, email: row.email, phone: row.phone, status: row.status, primaryAdminName: row.primary_admin_name, userCount: row.user_count, teamCount: row.team_count, openTicketCount: row.open_ticket_count }));
}

export async function createPlatformCompany(input: CreatePlatformCompanyInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const company = await client.query<{ id: string }>(`INSERT INTO companies (name, legal_name, trade_name, document, email, phone, address_line1, address_line2, city, state, postal_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, [input.tradeName, input.legalName, input.tradeName, input.document, input.email, input.phone, input.addressLine1, input.addressLine2 ?? null, input.city, input.state, input.postalCode]);
    const passwordHash = await bcrypt.hash(input.temporaryPassword, 10);
    const admin = await client.query<{ id: string }>(`INSERT INTO users (company_id, name, email, password_hash, role, status, must_change_password) VALUES ($1,$2,$3,$4,'COMPANY_ADMIN','ACTIVE',TRUE) RETURNING id`, [company.rows[0].id, input.adminName, input.adminEmail.toLowerCase(), passwordHash]);
    await client.query("UPDATE companies SET primary_admin_id = $1 WHERE id = $2", [admin.rows[0].id, company.rows[0].id]);
    await client.query("COMMIT");
    return { id: company.rows[0].id, primaryAdminId: admin.rows[0].id };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
