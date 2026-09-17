import { describe, expect, it, vi } from "vitest";

const query = vi.hoisted(() => vi.fn());

vi.mock("../../src/database/connection", () => ({
  pool: { query },
}));

import { listTickets } from "../../src/services/ticket.service";

describe("ticket.service.listTickets", () => {
  it("converte o número do chamado para texto ao pesquisar", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ total: "0" }] })
      .mockResolvedValueOnce({ rows: [] });

    await listTickets({
      companyId: "company-1",
      userId: "user-1",
      role: "ADMIN",
      page: 1,
      pageSize: 20,
      search: "42",
    });

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("CAST(t.ticket_number AS TEXT) ILIKE $2"),
      ["company-1", "%42%"],
    );
  });
});
