import { z } from "zod";

export const listTeamsQuerySchema = z.object({
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
});

export const teamIdParamSchema = z.object({
  id: z
    .string()
    .uuid("ID da equipe inválido."),
});

export const teamMemberParamSchema = z.object({
  id: z
    .string()
    .uuid("ID da equipe inválido."),

  userId: z
    .string()
    .uuid("ID do usuário inválido."),
});

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(100),

  description: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),
});

export const updateTeamSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      Object.values(data).some(
        (value) => value !== undefined
      ),
    {
      message:
        "Informe pelo menos um campo para atualização.",
    }
  );

export const addTeamMemberSchema = z.object({
  userId: z
    .string()
    .uuid("ID do usuário inválido."),
});

export type ListTeamsQuery =
  z.infer<typeof listTeamsQuerySchema>;

export type CreateTeamInput =
  z.infer<typeof createTeamSchema>;

export type UpdateTeamInput =
  z.infer<typeof updateTeamSchema>;