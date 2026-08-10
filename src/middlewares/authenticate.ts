import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { pool } from "../database/connection";

interface TokenPayload {
  sub: string;
  companyId: string;
  role: "ADMIN" | "AGENT" | "REQUESTER";
}

interface DatabaseUser {
  id: string;
  company_id: string;
  customer_id: string | null;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "REQUESTER";
  status: "ACTIVE" | "INACTIVE";
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
          status
        FROM users
        WHERE id = $1
          AND company_id = $2
        LIMIT 1;
      `,
      [userId, payload.companyId]
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
      companyId: user.company_id,
      customerId: user.customer_id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
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