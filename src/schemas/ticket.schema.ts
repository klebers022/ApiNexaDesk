import { z } from "zod";

export const ticketIdParamSchema = z.object({
  id: z
    .string()
    .uuid("ID do ticket inválido."),
});

export const listTicketsQuerySchema = z.object({
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
    .enum([
      "OPEN",
      "IN_PROGRESS",
      "WAITING_CUSTOMER",
      "RESOLVED",
      "CLOSED",
    ])
    .optional(),

  priority: z
    .enum([
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ])
    .optional(),

  categoryId: z
    .string()
    .uuid()
    .optional(),

  teamId: z
    .string()
    .uuid()
    .optional(),

  assigneeId: z
    .string()
    .uuid()
    .optional(),
});

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(
      3,
      "Título deve ter pelo menos 3 caracteres."
    )
    .max(200),

  description: z
    .string()
    .trim()
    .min(
      5,
      "Descrição deve ter pelo menos 5 caracteres."
    ),

  priority: z
    .enum([
      "LOW",
      "MEDIUM",
      "HIGH",
      "URGENT",
    ])
    .default("MEDIUM"),

  categoryId: z
    .string()
    .uuid(
      "ID da categoria inválido."
    ),

  requesterId: z
    .string()
    .uuid(
      "ID do solicitante inválido."
    )
    .optional(),

  teamId: z
    .string()
    .uuid(
      "ID da equipe inválido."
    )
    .nullable()
    .optional(),

  assigneeId: z
    .string()
    .uuid(
      "ID do responsável inválido."
    )
    .nullable()
    .optional(),
});

export type ListTicketsQuery =
  z.infer<
    typeof listTicketsQuerySchema
  >;

export type CreateTicketInput =
  z.infer<
    typeof createTicketSchema
  >;

  export const updateTicketSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3)
      .max(200)
      .optional(),

    description: z
      .string()
      .trim()
      .min(5)
      .optional(),

    priority: z
      .enum([
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT",
      ])
      .optional(),

    categoryId: z
      .string()
      .uuid("ID da categoria inválido.")
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

export const assignTicketSchema = z
  .object({
    teamId: z
      .string()
      .uuid("ID da equipe inválido.")
      .nullable()
      .optional(),

    assigneeId: z
      .string()
      .uuid("ID do responsável inválido.")
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.teamId !== undefined ||
      data.assigneeId !== undefined,
    {
      message:
        "Informe teamId ou assigneeId.",
    }
  );

export const changeTicketStatusSchema =
  z.object({
    status: z.enum([
      "OPEN",
      "IN_PROGRESS",
      "WAITING_CUSTOMER",
      "RESOLVED",
      "CLOSED",
    ]),
  });

export type UpdateTicketInput =
  z.infer<typeof updateTicketSchema>;

export type AssignTicketInput =
  z.infer<typeof assignTicketSchema>;

 export const createTicketCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(
      1,
      "O comentário não pode estar vazio."
    ),

  isInternal: z
    .boolean()
    .default(false),
});

export type CreateTicketCommentInput =
  z.infer<
    typeof createTicketCommentSchema
  >;


