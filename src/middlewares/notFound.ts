import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  AppError,
} from "../errors/AppError";

export function notFound(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  next(
    new AppError(
      `Rota ${request.method} ${request.originalUrl} não encontrada.`,
      404,
      "ROUTE_NOT_FOUND"
    )
  );
}