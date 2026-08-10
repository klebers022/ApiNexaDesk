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

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Nome deve ter pelo menos 3 caracteres.")
      .max(150),

    email: z
      .string()
      .email("Informe um e-mail válido.")
      .transform((email) => email.toLowerCase()),

    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres."),

    role: z.enum([
      "ADMIN",
      "AGENT",
      "REQUESTER",
    ]),

    customerId: z
      .string()
      .uuid("customerId inválido.")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.role === "REQUESTER" &&
      !data.customerId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerId"],
        message:
          "REQUESTER deve estar vinculado a um cliente.",
      });
    }

    if (
      data.role !== "REQUESTER" &&
      data.customerId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerId"],
        message:
          "Somente REQUESTER pode possuir customerId.",
      });
    }
  });

export type CreateUserInput =
  z.infer<typeof createUserSchema>;

export type ListUsersQuery =
  z.infer<typeof listUsersQuerySchema>;