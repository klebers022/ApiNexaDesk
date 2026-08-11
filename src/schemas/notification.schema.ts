import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
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

  type: z
    .enum([
      "TICKET_ASSIGNED",
      "TICKET_COMMENTED",
      "TICKET_RESOLVED",
      "SLA_WARNING",
    ])
    .optional(),

  status: z
    .enum([
      "READ",
      "UNREAD",
    ])
    .optional(),
});

export const notificationIdParamSchema =
  z.object({
    id: z
      .string()
      .uuid(
        "ID da notificação inválido."
      ),
  });

export type ListNotificationsQuery =
  z.infer<
    typeof listNotificationsQuerySchema
  >;