import {
  Request,
  Response,
} from "express";

import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from "../schemas/notification.schema";

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification.service";

// ======================================================
// LIST NOTIFICATIONS
// ======================================================

export async function listNotificationsController(
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
    listNotificationsQuerySchema.safeParse(
      request.query
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code:
          "VALIDATION_ERROR",

        message:
          "Parâmetros de consulta inválidos.",

        details:
          validation.error.issues,
      },
    });
  }

  try {
    const result =
      await listNotifications({
        companyId:
          request.user.companyId,

        userId:
          request.user.id,

        ...validation.data,
      });

    return response
      .status(200)
      .json({
        data:
          result.notifications,

        pagination:
          result.pagination,
      });
  } catch (error) {
    console.error(
      "Erro ao listar notificações:",
      error
    );

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

// ======================================================
// UNREAD COUNT
// ======================================================

export async function unreadCountController(
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

  try {
    const result =
      await getUnreadNotificationCount({
        companyId:
          request.user.companyId,

        userId:
          request.user.id,
      });

    return response
      .status(200)
      .json({
        data: result,
      });
  } catch (error) {
    console.error(
      "Erro ao contar notificações não lidas:",
      error
    );

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

// ======================================================
// MARK ONE AS READ
// ======================================================

export async function markNotificationReadController(
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
    notificationIdParamSchema.safeParse(
      request.params
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code:
          "VALIDATION_ERROR",

        message:
          "ID da notificação inválido.",

        details:
          validation.error.issues,
      },
    });
  }

  try {
    const notification =
      await markNotificationAsRead({
        notificationId:
          validation.data.id,

        companyId:
          request.user.companyId,

        userId:
          request.user.id,
      });

    return response
      .status(200)
      .json({
        data: notification,
      });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "NOTIFICATION_NOT_FOUND"
    ) {
      return response.status(404).json({
        error: {
          code:
            "NOTIFICATION_NOT_FOUND",

          message:
            "Notificação não encontrada.",
        },
      });
    }

    console.error(
      "Erro ao marcar notificação como lida:",
      error
    );

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

// ======================================================
// MARK ALL AS READ
// ======================================================

export async function markAllNotificationsReadController(
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

  try {
    const result =
      await markAllNotificationsAsRead({
        companyId:
          request.user.companyId,

        userId:
          request.user.id,
      });

    return response
      .status(200)
      .json({
        data: result,
      });
  } catch (error) {
    console.error(
      "Erro ao marcar todas as notificações como lidas:",
      error
    );

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