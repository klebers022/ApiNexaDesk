import { z } from "zod";

export const listCategoriesQuerySchema = z.object({
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

  status: z
    .enum(["ACTIVE", "INACTIVE"])
    .optional(),
});

export const categoryIdParamSchema = z.object({
  id: z
    .string()
    .uuid("ID da categoria inválido."),
});

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Nome deve ter pelo menos 2 caracteres."
    )
    .max(
      100,
      "Nome deve ter no máximo 100 caracteres."
    ),

  description: z
    .string()
    .trim()
    .max(
      500,
      "Descrição deve ter no máximo 500 caracteres."
    )
    .nullable()
    .optional(),
});

export const updateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        2,
        "Nome deve ter pelo menos 2 caracteres."
      )
      .max(
        100,
        "Nome deve ter no máximo 100 caracteres."
      )
      .optional(),

    description: z
      .string()
      .trim()
      .max(
        500,
        "Descrição deve ter no máximo 500 caracteres."
      )
      .nullable()
      .optional(),

    status: z
      .enum(["ACTIVE", "INACTIVE"])
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

export type ListCategoriesQuery =
  z.infer<
    typeof listCategoriesQuerySchema
  >;

export type CreateCategoryInput =
  z.infer<
    typeof createCategorySchema
  >;

export type UpdateCategoryInput =
  z.infer<
    typeof updateCategorySchema
  >;