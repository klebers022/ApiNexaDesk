import { PoolClient } from "pg";

import { pool } from "../database/connection";

import {
  ListNotificationsQuery,
} from "../schemas/notification.schema";

// ======================================================
// TYPES
// ======================================================

export type NotificationType =
  | "TICKET_ASSIGNED"
  | "TICKET_COMMENTED"
  | "TICKET_RESOLVED"
  | "SLA_WARNING";

// ======================================================
// DATABASE TYPES
// ======================================================

interface DatabaseNotification {
  id: string;

  company_id: string;
  user_id: string;

  type: NotificationType;

  title: string;
  message: string;

  read_at: Date | null;
  created_at: Date;
}

interface CountResult {
  total: string;
}

// ======================================================
// MAP NOTIFICATION
// ======================================================

function mapNotification(
  notification: DatabaseNotification
) {
  return {
    id:
      notification.id,

    type:
      notification.type,

    title:
      notification.title,

    message:
      notification.message,

    isRead:
      notification.read_at !== null,

    readAt:
      notification.read_at,

    createdAt:
      notification.created_at,
  };
}

// ======================================================
// LIST NOTIFICATIONS
// ======================================================

interface ListNotificationsParams
  extends ListNotificationsQuery {
  companyId: string;
  userId: string;
}

export async function listNotifications({
  companyId,
  userId,

  page,
  pageSize,

  type,
  status,
}: ListNotificationsParams) {
  const conditions: string[] = [
    "n.company_id = $1",
    "n.user_id = $2",
  ];

  const values: unknown[] = [
    companyId,
    userId,
  ];

  // ======================================================
  // TYPE FILTER
  // ======================================================

  if (type) {
    values.push(type);

    conditions.push(
      `n.type = $${values.length}`
    );
  }

  // ======================================================
  // READ STATUS FILTER
  // ======================================================

  if (status === "UNREAD") {
    conditions.push(
      "n.read_at IS NULL"
    );
  }

  if (status === "READ") {
    conditions.push(
      "n.read_at IS NOT NULL"
    );
  }

  const whereClause =
    conditions.join(" AND ");

  // ======================================================
  // COUNT
  // ======================================================

  const countResult =
    await pool.query<CountResult>(
      `
        SELECT
          COUNT(*) AS total

        FROM notifications n

        WHERE ${whereClause};
      `,
      values
    );

  const total =
    Number(
      countResult.rows[0].total
    );

  // ======================================================
  // PAGINATION
  // ======================================================

  const offset =
    (page - 1) * pageSize;

  const dataValues = [
    ...values,
    pageSize,
    offset,
  ];

  const limitPosition =
    dataValues.length - 1;

  const offsetPosition =
    dataValues.length;

  // ======================================================
  // DATA
  // ======================================================

  const result =
    await pool.query<DatabaseNotification>(
      `
        SELECT
          n.id,

          n.company_id,
          n.user_id,

          n.type,

          n.title,
          n.message,

          n.read_at,
          n.created_at

        FROM notifications n

        WHERE ${whereClause}

        ORDER BY
          n.created_at DESC

        LIMIT $${limitPosition}
        OFFSET $${offsetPosition};
      `,
      dataValues
    );

  const notifications =
    result.rows.map(
      mapNotification
    );

  return {
    notifications,

    pagination: {
      page,
      pageSize,
      total,

      totalPages:
        Math.ceil(
          total / pageSize
        ),
    },
  };
}

// ======================================================
// UNREAD COUNT
// ======================================================

interface UnreadCountParams {
  companyId: string;
  userId: string;
}

export async function getUnreadNotificationCount({
  companyId,
  userId,
}: UnreadCountParams) {
  const result =
    await pool.query<CountResult>(
      `
        SELECT
          COUNT(*) AS total

        FROM notifications

        WHERE company_id = $1
          AND user_id = $2
          AND read_at IS NULL;
      `,
      [
        companyId,
        userId,
      ]
    );

  return {
    count:
      Number(
        result.rows[0].total
      ),
  };
}

// ======================================================
// MARK ONE NOTIFICATION AS READ
// ======================================================

interface MarkNotificationReadParams {
  notificationId: string;
  companyId: string;
  userId: string;
}

export async function markNotificationAsRead({
  notificationId,
  companyId,
  userId,
}: MarkNotificationReadParams) {
  const result =
    await pool.query<DatabaseNotification>(
      `
        UPDATE notifications

        SET
          read_at =
            COALESCE(
              read_at,
              NOW()
            )

        WHERE id = $1
          AND company_id = $2
          AND user_id = $3

        RETURNING
          id,
          company_id,
          user_id,
          type,
          title,
          message,
          read_at,
          created_at;
      `,
      [
        notificationId,
        companyId,
        userId,
      ]
    );

  const notification =
    result.rows[0];

  if (!notification) {
    throw new Error(
      "NOTIFICATION_NOT_FOUND"
    );
  }

  return mapNotification(
    notification
  );
}

// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// ======================================================

interface MarkAllNotificationsReadParams {
  companyId: string;
  userId: string;
}

export async function markAllNotificationsAsRead({
  companyId,
  userId,
}: MarkAllNotificationsReadParams) {
  const result =
    await pool.query(
      `
        UPDATE notifications

        SET
          read_at = NOW()

        WHERE company_id = $1
          AND user_id = $2
          AND read_at IS NULL;
      `,
      [
        companyId,
        userId,
      ]
    );

  return {
    updated:
      result.rowCount ?? 0,
  };
}

// ======================================================
// CREATE NOTIFICATION USING TRANSACTION CLIENT
// ======================================================

interface CreateNotificationParams {
  companyId: string;
  userId: string;

  type: NotificationType;

  title: string;
  message: string;
}

export async function createNotificationWithClient(
  client: PoolClient,
  {
    companyId,
    userId,
    type,
    title,
    message,
  }: CreateNotificationParams
) {
  const result =
    await client.query<DatabaseNotification>(
      `
        INSERT INTO notifications (
          company_id,
          user_id,
          type,
          title,
          message
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )

        RETURNING
          id,
          company_id,
          user_id,
          type,
          title,
          message,
          read_at,
          created_at;
      `,
      [
        companyId,
        userId,
        type,
        title,
        message,
      ]
    );

  const notification =
    result.rows[0];

  return mapNotification(
    notification
  );
}