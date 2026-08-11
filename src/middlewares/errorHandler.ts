import {
  ErrorRequestHandler,
} from "express";

import {
  AppError,
} from "../errors/AppError";

export const errorHandler:
  ErrorRequestHandler = (
    error,
    request,
    response,
    _next
  ) => {
    // ======================================================
    // APP ERROR
    // ======================================================

    if (
      error instanceof AppError
    ) {
      return response
        .status(
          error.statusCode
        )
        .json({
          error: {
            code:
              error.code,

            message:
              error.message,

            ...(error.details !==
              undefined && {
              details:
                error.details,
            }),
          },
        });
    }

    // ======================================================
    // INVALID JSON
    // ======================================================

    if (
      error instanceof SyntaxError &&
      "body" in error
    ) {
      return response
        .status(400)
        .json({
          error: {
            code:
              "INVALID_JSON",

            message:
              "O corpo JSON enviado é inválido.",
          },
        });
    }

    // ======================================================
    // CORS
    // ======================================================

    if (
      error instanceof Error &&
      error.message ===
        "CORS_NOT_ALLOWED"
    ) {
      return response
        .status(403)
        .json({
          error: {
            code:
              "CORS_NOT_ALLOWED",

            message:
              "Origem não permitida.",
          },
        });
    }

    // ======================================================
    // POSTGRES
    // ======================================================

    const databaseError =
      error as {
        code?: string;
        constraint?: string;
        detail?: string;
      };

    if (
      databaseError.code
    ) {
      console.error(
        "[DATABASE ERROR]",
        {
          method:
            request.method,

          path:
            request.originalUrl,

          code:
            databaseError.code,

          constraint:
            databaseError.constraint,

          detail:
            databaseError.detail,
        }
      );
    } else {
      console.error(
        "[UNHANDLED ERROR]",
        {
          method:
            request.method,

          path:
            request.originalUrl,

          error,
        }
      );
    }

    // ======================================================
    // INTERNAL ERROR
    // ======================================================

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
  };