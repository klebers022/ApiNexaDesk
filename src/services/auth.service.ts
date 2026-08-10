import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

import { pool } from "../database/connection";
import { env } from "../config/env";

interface DatabaseUser {
  id: string;
  company_id: string;
  customer_id: string | null;
  name: string;
  email: string;
  password_hash: string;
  role: "ADMIN" | "AGENT" | "REQUESTER";
  status: "ACTIVE" | "INACTIVE";
}

interface LoginData {
  email: string;
  password: string;
}

export async function login({
  email,
  password,
}: LoginData) {
  const result = await pool.query<DatabaseUser>(
    `
      SELECT
        id,
        company_id,
        customer_id,
        name,
        email,
        password_hash,
        role,
        status
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("USER_INACTIVE");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const options: SignOptions = {
    expiresIn:
      env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  const token = jwt.sign(
    {
      companyId: user.company_id,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      ...options,
      subject: user.id,
    }
  );

  return {
    token,

    user: {
      id: user.id,
      companyId: user.company_id,
      customerId: user.customer_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
}