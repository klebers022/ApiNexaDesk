import { z } from "zod";

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),

  pageSize: z.coerce.number().int().positive().max(100).default(20),

  search: z.string().trim().optional(),

  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const customerIdParamSchema = z.object({
  id: z.string().uuid("ID do cliente inválido."),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres.")
    .max(150),

  email: z.string().email("Informe um e-mail válido.").nullable().optional(),

  phone: z.string().trim().max(30).nullable().optional(),

  document: z.string().trim().max(30).nullable().optional(),
});

export const updateCustomerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Nome deve ter pelo menos 3 caracteres.")
      .max(150)
      .optional(),

    email: z.string().email("Informe um e-mail válido.").nullable().optional(),

    phone: z.string().trim().max(30).nullable().optional(),

    document: z.string().trim().max(30).nullable().optional(),

    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Informe pelo menos um campo para atualização.",
  });

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
