import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { pool } from "../database/connection";

interface TokenPayload {
  sub: string;
  companyId: string | null;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "ANALYST" | "REQUESTER";
}

interface DatabaseUser {
  id: string;
  company_id: string | null;
  customer_id: string | null;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "ANALYST" | "REQUESTER";
  status: "ACTIVE" | "INACTIVE";
  must_change_password: boolean;
}

export async function authenticate(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Token de autenticação não informado.",
      },
    });
  }

  const [type, token] = authorization.split(" ");

  if (type !== "Bearer" || !token) {
    return response.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Token de autenticação inválido.",
      },
    });
  }

  try {
    const payload = jwt.verify(
      token,
      env.JWT_SECRET
    ) as TokenPayload;

    const userId = payload.sub;

    const result = await pool.query<DatabaseUser>(
      `
        SELECT
          id,
          company_id,
          customer_id,
          name,
          email,
          role,
          status,
          must_change_password
        FROM users
        WHERE id = $1
        LIMIT 1;
      `,
      [userId]
    );

    const user = result.rows[0];

    if (!user || user.status !== "ACTIVE") {
      return response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Usuário não autorizado.",
        },
      });
    }

    request.user = {
      id: user.id,
      companyId: user.company_id ?? "",
      customerId: user.customer_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      mustChangePassword: user.must_change_password,
    };

    return next();
  } catch {
    return response.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Token inválido ou expirado.",
      },
    });
  }
}
