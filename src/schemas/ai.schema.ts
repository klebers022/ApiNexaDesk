import { z } from "zod";

// ======================================================
// TRIAGE SCHEMA
// ======================================================

export const triageTicketSchema = z.object({
  text: z
    .string()
    .trim()
    .min(3, "O texto para triagem deve ter pelo menos 3 caracteres.")
    .max(4000, "O texto para triagem não pode ultrapassar 4000 caracteres."),

  categoryId: z
    .string()
    .uuid("ID de categoria inválido.")
    .optional(),
});

export type TriageTicketInput = z.infer<typeof triageTicketSchema>;

// ======================================================
// SEARCH SOLUTIONS SCHEMA
// ======================================================

export const searchSolutionsSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "A consulta deve ter pelo menos 2 caracteres.")
    .max(500, "A consulta não pode ultrapassar 500 caracteres."),

  categoryId: z
    .string()
    .uuid("ID de categoria inválido.")
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(20)
    .default(5),
});

export type SearchSolutionsInput = z.infer<typeof searchSolutionsSchema>;

// ======================================================
// CHAT INTERACTION SCHEMA
// ======================================================

export const chatMessageRoleSchema = z.enum(["user", "assistant"]);

export const chatMessageSchema = z.object({
  role: chatMessageRoleSchema,
  content: z.string().trim().min(1).max(1000),
});

export const aiChatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "A mensagem não pode estar vazia.")
    .max(4000, "A mensagem não pode ultrapassar 4000 caracteres."),

  conversationHistory: z
    .array(chatMessageSchema)
    .max(12, "O histórico da conversa pode ter no máximo 12 mensagens.")
    .optional()
    .default([]),

  categoryId: z
    .string()
    .uuid("ID da categoria inválido.")
    .optional(),

  action: z
    .enum(["message", "resolve", "create_ticket"])
    .optional()
    .default("message"),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
