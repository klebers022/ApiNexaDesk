import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());
const compare = vi.hoisted(() => vi.fn());

vi.mock("../../src/database/connection", () => ({
  pool: { query },
}));

vi.mock("bcrypt", () => ({
  default: { compare },
}));

import { login } from "../../src/services/auth.service";

const activeUser = {
  id: "user-1",
  company_id: "company-1",
  customer_id: null,
  name: "Kleber",
  email: "kleber@example.com",
  password_hash: "hash",
  role: "ADMIN" as const,
  status: "ACTIVE" as const,
};

describe("auth.service.login", () => {
  beforeEach(() => {
    query.mockReset();
    compare.mockReset();
  });

  it("gera token e retorna os dados do usuário ativo com senha válida", async () => {
    query.mockResolvedValue({ rows: [activeUser] });
    compare.mockResolvedValue(true);

    const result = await login({
      email: activeUser.email,
      password: "senha-correta",
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("FROM users"),
      [activeUser.email],
    );
    expect(compare).toHaveBeenCalledWith("senha-correta", "hash");
    expect(result.user).toMatchObject({
      id: activeUser.id,
      companyId: activeUser.company_id,
      role: "ADMIN",
    });
    expect(jwt.verify(result.token, process.env.JWT_SECRET!)).toMatchObject({
      sub: activeUser.id,
      companyId: activeUser.company_id,
      role: "ADMIN",
    });
  });

  it("não revela se o e-mail não existe", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(
      login({ email: "ausente@example.com", password: "qualquer-senha" }),
    ).rejects.toThrow("INVALID_CREDENTIALS");
    expect(compare).not.toHaveBeenCalled();
  });

  it("bloqueia usuário inativo antes de validar a senha", async () => {
    query.mockResolvedValue({ rows: [{ ...activeUser, status: "INACTIVE" }] });

    await expect(
      login({ email: activeUser.email, password: "qualquer-senha" }),
    ).rejects.toThrow("USER_INACTIVE");
    expect(compare).not.toHaveBeenCalled();
  });

  it("rejeita senha incorreta", async () => {
    query.mockResolvedValue({ rows: [activeUser] });
    compare.mockResolvedValue(false);

    await expect(
      login({ email: activeUser.email, password: "senha-incorreta" }),
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });
});
