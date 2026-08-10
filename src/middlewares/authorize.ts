import { NextFunction, Request, Response } from "express";

import { UserRole } from "../types/auth";

export function authorize(...allowedRoles: UserRole[]) {
  return (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const user = request.user;

    if (!user) {
      return response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Usuário não autenticado.",
        },
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return response.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Você não possui permissão para acessar este recurso.",
        },
      });
    }

    return next();
  };
}