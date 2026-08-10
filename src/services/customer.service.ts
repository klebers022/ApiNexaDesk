import { pool } from "../database/connection";
import { ListCustomersQuery } from "../schemas/customer.schema";

interface DatabaseCustomer {
  id: string;
  company_id: string;

  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;

  created_at: Date;
  updated_at: Date;
}

interface CountResult {
  total: string;
}

interface ListCustomersParams
  extends ListCustomersQuery {
  companyId: string;
}

export async function listCustomers({
  companyId,
  page,
  pageSize,
  search,
}: ListCustomersParams) {
  const conditions = [
    "c.company_id = $1",
  ];

  const values: unknown[] = [
    companyId,
  ];

  if (search) {
    values.push(`%${search}%`);

    const position = values.length;

    conditions.push(`
      (
        c.name ILIKE $${position}
        OR c.email ILIKE $${position}
        OR c.document ILIKE $${position}
      )
    `);
  }

  const whereClause =
    conditions.join(" AND ");

  const countResult =
    await pool.query<CountResult>(
      `
        SELECT COUNT(*) AS total
        FROM customers c
        WHERE ${whereClause};
      `,
      values
    );

  const total =
    Number(countResult.rows[0].total);

  const offset =
    (page - 1) * pageSize;

  const dataValues = [
    ...values,
    pageSize,
    offset,
  ];

  const limitPosition =
    dataValues.length - 1;

  const offsetPosition =
    dataValues.length;

  const result =
    await pool.query<DatabaseCustomer>(
      `
        SELECT
          c.id,
          c.company_id,
          c.name,
          c.email,
          c.phone,
          c.document,
          c.created_at,
          c.updated_at

        FROM customers c

        WHERE ${whereClause}

        ORDER BY c.created_at DESC

        LIMIT $${limitPosition}
        OFFSET $${offsetPosition};
      `,
      dataValues
    );

  const customers =
    result.rows.map((customer) => ({
      id: customer.id,
      companyId: customer.company_id,

      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      document: customer.document,

      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    }));

  return {
    customers,

    pagination: {
      page,
      pageSize,
      total,

      totalPages:
        Math.ceil(total / pageSize),
    },
  };
}