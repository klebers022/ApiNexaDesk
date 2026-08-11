import {
  Request,
  Response,
} from "express";

import {
  dashboardQuerySchema,
} from "../schemas/dashboard.schema";

import {
  getDashboard,
} from "../services/dashboard.service";

// ======================================================
// DASHBOARD
// ======================================================

export async function getDashboardController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code:
          "UNAUTHORIZED",

        message:
          "Usuário não autenticado.",
      },
    });
  }

  // ======================================================
  // VALIDATION
  // ======================================================

  const validation =
    dashboardQuerySchema.safeParse(
      request.query
    );

  if (!validation.success) {
    return response
      .status(400)
      .json({
        error: {
          code:
            "VALIDATION_ERROR",

          message:
            "Parâmetros do dashboard inválidos.",

          details:
            validation
              .error
              .issues,
        },
      });
  }

  try {
    // ======================================================
    // SERVICE
    // ======================================================

    const dashboard =
      await getDashboard({
        companyId:
          request.user.companyId,

        userId:
          request.user.id,

        role:
          request.user.role,

        ...validation.data,
      });

    return response
      .status(200)
      .json({
        data:
          dashboard,
      });
  } catch (error) {
    console.error(
      "Erro ao carregar dashboard:",
      error
    );

    return response
      .status(500)
      .json({
        error: {
          code:
            "INTERNAL_SERVER_ERROR",

          message:
            "Erro interno do servidor.",
        },
      });
  }
}