import { Request, Response } from "express";
import { checkDatabaseHealth } from "../services/health.service";

export async function healthController(
  request: Request,
  response: Response
) {
  const database = await checkDatabaseHealth();

  return response.status(200).json({
    data: {
      status: "deploy funcioanando automaticamente",
      database: "connected",
      timestamp: database.databaseTime,
    },
  });
}
