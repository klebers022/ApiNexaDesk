import { Request, Response } from "express";

import { loginSchema } from "../schemas/auth.schema";
import { login } from "../services/auth.service";


export async function meController(
  request: Request,
  response: Response
) {
  return response.status(200).json({
    data: {
      user: request.user,
    },
  });
}

export async function loginController(
  request: Request,
  response: Response
) {
  const validation = loginSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados de login inválidos.",
        details: validation.error.flatten().fieldErrors,
      },
    });
  }

  try {
    const result = await login(validation.data);

    return response.status(200).json({
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      return response.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "E-mail ou senha inválidos.",
        },
      });
    }

    if (
      error instanceof Error &&
      error.message === "USER_INACTIVE"
    ) {
      return response.status(403).json({
        error: {
          code: "USER_INACTIVE",
          message: "Este usuário está inativo.",
        },
      });
    }

    console.error(error);

    return response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro interno do servidor.",
      },
    });
  }
}