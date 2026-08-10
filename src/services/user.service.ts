import { pool } from "../database/connection";

import bcrypt from "bcrypt";

import { CreateUserInput, ListUsersQuery } from "../schemas/user.schema";

interface DatabaseUser {
  id: string;
  company_id: string;
  customer_id: string | null;

  name: string;
  email: string;

  role: "ADMIN" | "AGENT" | "REQUESTER";
  status: "ACTIVE" | "INACTIVE";

  customer_name: string | null;

  created_at: Date;
  updated_at: Date;
}

interface CountResult {
  total: string;
}

interface ListUsersParams extends ListUsersQuery {
  companyId: string;
}

export async function listUsers({
  companyId,
  page,
  pageSize,
  search,
  role,
  status,
}: ListUsersParams) {
  const conditions: string[] = ["u.company_id = $1"];

  const values: unknown[] = [companyId];

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        u.name ILIKE $${values.length}
        OR u.email ILIKE $${values.length}
      )
    `);
  }

  if (role) {
    values.push(role);

    conditions.push(`u.role = $${values.length}`);
  }

  if (status) {
    values.push(status);

    conditions.push(`u.status = $${values.length}`);
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query<CountResult>(
    `
      SELECT COUNT(*) AS total
      FROM users u
      WHERE ${whereClause};
    `,
    values,
  );

  const total = Number(countResult.rows[0].total);

  const offset = (page - 1) * pageSize;

  const dataValues = [...values, pageSize, offset];

  const limitPosition = dataValues.length - 1;

  const offsetPosition = dataValues.length;

  const usersResult = await pool.query<DatabaseUser>(
    `
        SELECT
          u.id,
          u.company_id,
          u.customer_id,
          u.name,
          u.email,
          u.role,
          u.status,

          c.name AS customer_name,

          u.created_at,
          u.updated_at

        FROM users u

        LEFT JOIN customers c
          ON c.company_id = u.company_id
         AND c.id = u.customer_id

        WHERE ${whereClause}

        ORDER BY u.created_at DESC

        LIMIT $${limitPosition}
        OFFSET $${offsetPosition};
      `,
    dataValues,
  );

  const users = usersResult.rows.map((user) => ({
    id: user.id,

    companyId: user.company_id,

    customerId: user.customer_id,

    customerName: user.customer_name,

    name: user.name,
    email: user.email,

    role: user.role,
    status: user.status,

    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }));

  return {
    users,

    pagination: {
      page,
      pageSize,
      total,

      totalPages: Math.ceil(total / pageSize),
    },
  };
}

interface UserById {
  id: string;
  company_id: string;
  customer_id: string | null;

  name: string;
  email: string;

  role: "ADMIN" | "AGENT" | "REQUESTER";
  status: "ACTIVE" | "INACTIVE";

  customer_name: string | null;

  created_at: Date;
  updated_at: Date;
}

interface GetUserByIdParams {
  userId: string;
  companyId: string;
}

export async function getUserById({ userId, companyId }: GetUserByIdParams) {
  const result = await pool.query<UserById>(
    `
      SELECT
        u.id,
        u.company_id,
        u.customer_id,
        u.name,
        u.email,
        u.role,
        u.status,

        c.name AS customer_name,

        u.created_at,
        u.updated_at

      FROM users u

      LEFT JOIN customers c
        ON c.company_id = u.company_id
       AND c.id = u.customer_id

      WHERE u.id = $1
        AND u.company_id = $2

      LIMIT 1;
    `,
    [userId, companyId],
  );

  const user = result.rows[0];

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    companyId: user.company_id,

    customerId: user.customer_id,
    customerName: user.customer_name,

    name: user.name,
    email: user.email,

    role: user.role,
    status: user.status,

    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

interface CreateUserParams
  extends CreateUserInput {
  companyId: string;
}

export async function createUser({
  companyId,
  name,
  email,
  password,
  role,
  customerId,
}: CreateUserParams) {
  const existingUser =
    await pool.query<{ id: string }>(
      `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1;
      `,
      [email]
    );

  if (existingUser.rows[0]) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  let validatedCustomerId:
    | string
    | null = null;

  if (role === "REQUESTER") {
    const customer =
      await pool.query<{ id: string }>(
        `
          SELECT id
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

    if (!customer.rows[0]) {
      throw new Error(
        "CUSTOMER_NOT_FOUND"
      );
    }

    validatedCustomerId =
      customer.rows[0].id;
  }

  const passwordHash =
    await bcrypt.hash(password, 10);

  const result = await pool.query<{
    id: string;
    company_id: string;
    customer_id: string | null;
    name: string;
    email: string;
    role:
      | "ADMIN"
      | "AGENT"
      | "REQUESTER";
    status:
      | "ACTIVE"
      | "INACTIVE";
    created_at: Date;
    updated_at: Date;
  }>(
    `
      INSERT INTO users (
        company_id,
        customer_id,
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'ACTIVE'
      )
      RETURNING
        id,
        company_id,
        customer_id,
        name,
        email,
        role,
        status,
        created_at,
        updated_at;
    `,
    [
      companyId,
      validatedCustomerId,
      name,
      email,
      passwordHash,
      role,
    ]
  );

  const user = result.rows[0];

  return {
    id: user.id,
    companyId: user.company_id,
    customerId: user.customer_id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}