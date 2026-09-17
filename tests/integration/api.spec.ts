import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const checkDatabaseHealth = vi.hoisted(() => vi.fn());

vi.mock("../../src/services/health.service", () => ({
  checkDatabaseHealth,
}));

import { app } from "../../src/app";

describe("API", () => {
  beforeEach(() => {
    checkDatabaseHealth.mockResolvedValue({
      databaseTime: "2026-01-01T00:00:00.000Z",
    });
  });

  describe("GET /api/v1/health", () => {
    it("retorna o estado da aplicação sem acessar banco real", async () => {
      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: {
          status: "ok",
          database: "connected",
          timestamp: "2026-01-01T00:00:00.000Z",
        },
      });
      expect(checkDatabaseHealth).toHaveBeenCalledOnce();
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("rejeita payload de login inválido antes de consultar o banco", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "email-invalido", password: "" });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("rotas protegidas", () => {
    it("bloqueia tickets sem token de autenticação", async () => {
      const response = await request(app).get("/api/v1/tickets");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: {
          code: "UNAUTHORIZED",
          message: "Token de autenticação não informado.",
        },
      });
    });

    it("bloqueia um token malformado", async () => {
      const response = await request(app)
        .get("/api/v1/tickets")
        .set("Authorization", "Bearer token-invalido");

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_TOKEN");
    });
  });
});
