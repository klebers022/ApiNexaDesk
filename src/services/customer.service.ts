import { pool } from "../database/connection";

import {
  ListCustomersQuery,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../schemas/customer.schema";

interface DatabaseCustomer {
  id: string;
  company_id: string;

  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;

  status: "ACTIVE" | "INACTIVE";

  created_at: Date;
  updated_at: Date;
}

interface CountResult {
  total: string;
}

// ======================================================
// LIST CUSTOMERS
// ======================================================

interface ListCustomersParams extends ListCustomersQuery {
  companyId: string;
}

export async function listCustomers({
  companyId,
  page,
  pageSize,
  search,
  status,
}: ListCustomersParams) {
  const conditions: string[] = [
    "c.company_id = $1",
  ];

  const values: unknown[] = [
    companyId,
  ];

  // Filtro por status
  if (status) {
    values.push(status);

    conditions.push(
      `c.status = $${values.length}`
    );
  }

  // Busca
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

  // Total de registros
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

  // Consulta dos clientes
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
          c.status,
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

      companyId:
        customer.company_id,

      name:
        customer.name,

      email:
        customer.email,

      phone:
        customer.phone,

      document:
        customer.document,

      status:
        customer.status,

      createdAt:
        customer.created_at,

      updatedAt:
        customer.updated_at,
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

// ======================================================
// GET CUSTOMER BY ID
// ======================================================

interface GetCustomerByIdParams {
  customerId: string;
  companyId: string;
}

export async function getCustomerById({
  customerId,
  companyId,
}: GetCustomerByIdParams) {
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
          c.status,
          c.created_at,
          c.updated_at

        FROM customers c

        WHERE c.id = $1
          AND c.company_id = $2

        LIMIT 1;
      `,
      [
        customerId,
        companyId,
      ]
    );

  const customer =
    result.rows[0];

  if (!customer) {
    return null;
  }

  return {
    id:
      customer.id,

    companyId:
      customer.company_id,

    name:
      customer.name,

    email:
      customer.email,

    phone:
      customer.phone,

    document:
      customer.document,

    status:
      customer.status,

    createdAt:
      customer.created_at,

    updatedAt:
      customer.updated_at,
  };
}

// ======================================================
// CREATE CUSTOMER
// ======================================================

interface CreateCustomerParams
  extends CreateCustomerInput {
  companyId: string;
}

export async function createCustomer({
  companyId,
  name,
  email,
  phone,
  document,
}: CreateCustomerParams) {
  // Verifica documento duplicado
  if (document) {
    const existingCustomer =
      await pool.query<{ id: string }>(
        `
          SELECT id
          FROM customers
          WHERE company_id = $1
            AND document = $2
          LIMIT 1;
        `,
        [
          companyId,
          document,
        ]
      );

    if (existingCustomer.rows[0]) {
      throw new Error(
        "CUSTOMER_DOCUMENT_ALREADY_EXISTS"
      );
    }
  }

  const result =
    await pool.query<DatabaseCustomer>(
      `
        INSERT INTO customers (
          company_id,
          name,
          email,
          phone,
          document
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )

        RETURNING
          id,
          company_id,
          name,
          email,
          phone,
          document,
          status,
          created_at,
          updated_at;
      `,
      [
        companyId,
        name,
        email ?? null,
        phone ?? null,
        document ?? null,
      ]
    );

  const customer =
    result.rows[0];

  return {
    id:
      customer.id,

    companyId:
      customer.company_id,

    name:
      customer.name,

    email:
      customer.email,

    phone:
      customer.phone,

    document:
      customer.document,

    status:
      customer.status,

    createdAt:
      customer.created_at,

    updatedAt:
      customer.updated_at,
  };
}

// ======================================================
// UPDATE CUSTOMER
// ======================================================

interface UpdateCustomerParams
  extends UpdateCustomerInput {
  customerId: string;
  companyId: string;
}

export async function updateCustomer({
  customerId,
  companyId,
  name,
  email,
  phone,
  document,
  status,
}: UpdateCustomerParams) {
  // Primeiro busca o cliente atual
  const currentResult =
    await pool.query<DatabaseCustomer>(
      `
        SELECT
          id,
          company_id,
          name,
          email,
          phone,
          document,
          status,
          created_at,
          updated_at

        FROM customers

        WHERE id = $1
          AND company_id = $2

        LIMIT 1;
      `,
      [
        customerId,
        companyId,
      ]
    );

  const currentCustomer =
    currentResult.rows[0];

  if (!currentCustomer) {
    throw new Error(
      "CUSTOMER_NOT_FOUND"
    );
  }

  // Verifica documento duplicado
  if (
    document !== undefined &&
    document !== null
  ) {
    const documentResult =
      await pool.query<{ id: string }>(
        `
          SELECT id

          FROM customers

          WHERE company_id = $1
            AND document = $2
            AND id <> $3

          LIMIT 1;
        `,
        [
          companyId,
          document,
          customerId,
        ]
      );

    if (documentResult.rows[0]) {
      throw new Error(
        "CUSTOMER_DOCUMENT_ALREADY_EXISTS"
      );
    }
  }

  const result =
    await pool.query<DatabaseCustomer>(
      `
        UPDATE customers

        SET
          name = COALESCE($1, name),
          email = $2,
          phone = $3,
          document = $4,
          status = COALESCE($5, status)

        WHERE id = $6
          AND company_id = $7

        RETURNING
          id,
          company_id,
          name,
          email,
          phone,
          document,
          status,
          created_at,
          updated_at;
      `,
      [
        // $1
        name ?? null,

        // $2
        email !== undefined
          ? email
          : currentCustomer.email,

        // $3
        phone !== undefined
          ? phone
          : currentCustomer.phone,

        // $4
        document !== undefined
          ? document
          : currentCustomer.document,

        // $5
        status ?? null,

        // $6
        customerId,

        // $7
        companyId,
      ]
    );

  const customer =
    result.rows[0];

  return {
    id:
      customer.id,

    companyId:
      customer.company_id,

    name:
      customer.name,

    email:
      customer.email,

    phone:
      customer.phone,

    document:
      customer.document,

    status:
      customer.status,

    createdAt:
      customer.created_at,

    updatedAt:
      customer.updated_at,
  };
}

// ======================================================
// DEACTIVATE CUSTOMER
// ======================================================

interface DeactivateCustomerParams {
  customerId: string;
  companyId: string;
}

export async function deactivateCustomer({
  customerId,
  companyId,
}: DeactivateCustomerParams) {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    // Inativa o cliente
    const result =
      await client.query<DatabaseCustomer>(
        `
          UPDATE customers

          SET status = 'INACTIVE'

          WHERE id = $1
            AND company_id = $2

          RETURNING
            id,
            company_id,
            name,
            email,
            phone,
            document,
            status,
            created_at,
            updated_at;
        `,
        [
          customerId,
          companyId,
        ]
      );

    const customer =
      result.rows[0];

    if (!customer) {
      throw new Error(
        "CUSTOMER_NOT_FOUND"
      );
    }

    // Inativa REQUESTERs vinculados ao cliente
    await client.query(
      `
        UPDATE users

        SET status = 'INACTIVE'

        WHERE company_id = $1
          AND customer_id = $2
          AND role = 'REQUESTER';
      `,
      [
        companyId,
        customerId,
      ]
    );

    await client.query(
      "COMMIT"
    );

    return {
      id:
        customer.id,

      companyId:
        customer.company_id,

      name:
        customer.name,

      email:
        customer.email,

      phone:
        customer.phone,

      document:
        customer.document,

      status:
        customer.status,

      createdAt:
        customer.created_at,

      updatedAt:
        customer.updated_at,
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}