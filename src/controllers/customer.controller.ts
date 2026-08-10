import {
  Request,
  Response,
} from "express";

import {
  listCustomersQuerySchema,
} from "../schemas/customer.schema";

import {
  listCustomers,
} from "../services/customer.service";

export async function listCustomersController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message:
          "Usuário não autenticado.",
      },
    });
  }

  const validation =
    listCustomersQuerySchema.safeParse(
      request.query
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Parâmetros de consulta inválidos.",
        details:
          validation.error.issues,
      },
    });
  }

  try {
    const result =
      await listCustomers({
        companyId:
          request.user.companyId,

        ...validation.data,
      });

    return response.status(200).json({
      data: result.customers,
      pagination:
        result.pagination,
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      error: {
        code:
          "INTERNAL_SERVER_ERROR",
        message:
          "Erro interno do servidor.",
      },
    });
  }
}