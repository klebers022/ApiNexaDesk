import { z } from "zod";

export const articleSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(20).max(20000),
  categoryId: z.string().uuid().optional().nullable(),
  sourceTicketId: z.string().uuid().optional().nullable(),
});

export const articleStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});
