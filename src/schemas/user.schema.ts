import { z } from "zod";

export const listUsersQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),

  search: z
    .string()
    .trim()
    .optional(),

  role: z
    .enum(["ADMIN", "AGENT", "REQUESTER"])
    .optional(),

  status: z
    .enum(["ACTIVE", "INACTIVE"])
    .optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("ID do usuário inválido."),
});

export type ListUsersQuery =
  z.infer<typeof listUsersQuerySchema>;