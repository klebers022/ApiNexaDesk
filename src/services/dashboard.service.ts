import { pool } from "../database/connection";

import {
  DashboardQuery,
} from "../schemas/dashboard.schema";

// ======================================================
// TYPES
// ======================================================

type UserRole =
  | "ADMIN"
  | "AGENT"
  | "REQUESTER";

interface DashboardParams
  extends DashboardQuery {
  companyId: string;
  userId: string;
  role: UserRole;
}

// ======================================================
// DATABASE RESULTS
// ======================================================

interface DashboardSummaryRow {
  total_tickets: number;

  open_tickets: number;
  in_progress_tickets: number;
  waiting_customer_tickets: number;

  resolved_tickets: number;
  closed_tickets: number;

  urgent_tickets: number;
  unassigned_tickets: number;

  average_resolution_hours: number;
}

interface StatusRow {
  status: string;
  total: number;
}

interface PriorityRow {
  priority: string;
  total: number;
}

interface CategoryRow {
  category_id: string;
  category_name: string;
  total: number;
}

interface PeriodRow {
  date: string;
  total: number;
}

interface AgentRankingRow {
  agent_id: string;
  agent_name: string;

  resolved_tickets: number;

  average_resolution_hours:
    number;
}

// ======================================================
// ACCESS FILTER
// ======================================================

function buildTicketAccessFilter({
  companyId,
  userId,
  role,
}: {
  companyId: string;
  userId: string;
  role: UserRole;
}) {
  // ======================================================
  // ADMIN
  // ======================================================

  if (role === "ADMIN") {
    return {
      where: `
        t.company_id = $1
      `,

      values: [
        companyId,
      ] as unknown[],
    };
  }

  // ======================================================
  // REQUESTER
  // ======================================================

  if (role === "REQUESTER") {
    return {
      where: `
        t.company_id = $1
        AND t.requester_id = $2
      `,

      values: [
        companyId,
        userId,
      ] as unknown[],
    };
  }

  // ======================================================
  // AGENT
  // ======================================================

  return {
    where: `
      t.company_id = $1

      AND (
        t.assignee_id = $2

        OR t.team_id IN (
          SELECT
            tm.team_id

          FROM team_members tm

          WHERE tm.company_id = $1
            AND tm.user_id = $2
        )
      )
    `,

    values: [
      companyId,
      userId,
    ] as unknown[],
  };
}

// ======================================================
// DASHBOARD
// ======================================================

export async function getDashboard({
  companyId,
  userId,
  role,

  periodDays,
}: DashboardParams) {
  const access =
    buildTicketAccessFilter({
      companyId,
      userId,
      role,
    });

  // ======================================================
  // SUMMARY
  // ======================================================

  const summaryPromise =
    pool.query<DashboardSummaryRow>(
      `
        SELECT
          COUNT(*)::int
            AS total_tickets,

          COUNT(*) FILTER (
            WHERE t.status = 'OPEN'
          )::int
            AS open_tickets,

          COUNT(*) FILTER (
            WHERE t.status = 'IN_PROGRESS'
          )::int
            AS in_progress_tickets,

          COUNT(*) FILTER (
            WHERE t.status = 'WAITING_CUSTOMER'
          )::int
            AS waiting_customer_tickets,

          COUNT(*) FILTER (
            WHERE t.status = 'RESOLVED'
          )::int
            AS resolved_tickets,

          COUNT(*) FILTER (
            WHERE t.status = 'CLOSED'
          )::int
            AS closed_tickets,

          COUNT(*) FILTER (
            WHERE
              t.priority = 'URGENT'
              AND t.status NOT IN (
                'RESOLVED',
                'CLOSED'
              )
          )::int
            AS urgent_tickets,

          COUNT(*) FILTER (
            WHERE
              t.assignee_id IS NULL
              AND t.status NOT IN (
                'RESOLVED',
                'CLOSED'
              )
          )::int
            AS unassigned_tickets,

          ROUND(
            COALESCE(
              AVG(
                EXTRACT(
                  EPOCH FROM (
                    t.resolved_at -
                    t.created_at
                  )
                ) / 3600
              ) FILTER (
                WHERE
                  t.resolved_at
                    IS NOT NULL
              ),
              0
            )::numeric,
            2
          )::float8
            AS average_resolution_hours

        FROM tickets t

        WHERE ${access.where};
      `,
      access.values
    );

  // ======================================================
  // STATUS
  // ======================================================

  const statusPromise =
    pool.query<StatusRow>(
      `
        SELECT
          t.status,

          COUNT(*)::int
            AS total

        FROM tickets t

        WHERE ${access.where}

        GROUP BY
          t.status

        ORDER BY
          CASE t.status

            WHEN 'OPEN'
              THEN 1

            WHEN 'IN_PROGRESS'
              THEN 2

            WHEN 'WAITING_CUSTOMER'
              THEN 3

            WHEN 'RESOLVED'
              THEN 4

            WHEN 'CLOSED'
              THEN 5

            ELSE 6

          END;
      `,
      access.values
    );

  // ======================================================
  // PRIORITY
  // ======================================================

  const priorityPromise =
    pool.query<PriorityRow>(
      `
        SELECT
          t.priority,

          COUNT(*)::int
            AS total

        FROM tickets t

        WHERE ${access.where}

        GROUP BY
          t.priority

        ORDER BY
          CASE t.priority

            WHEN 'URGENT'
              THEN 1

            WHEN 'HIGH'
              THEN 2

            WHEN 'MEDIUM'
              THEN 3

            WHEN 'LOW'
              THEN 4

            ELSE 5

          END;
      `,
      access.values
    );

  // ======================================================
  // CATEGORIES
  // ======================================================

  const categoryPromise =
    pool.query<CategoryRow>(
      `
        SELECT
          c.id
            AS category_id,

          c.name
            AS category_name,

          COUNT(*)::int
            AS total

        FROM tickets t

        INNER JOIN categories c
          ON c.company_id =
              t.company_id

          AND c.id =
              t.category_id

        WHERE ${access.where}

        GROUP BY
          c.id,
          c.name

        ORDER BY
          total DESC,
          c.name ASC;
      `,
      access.values
    );

  // ======================================================
  // PERIOD
  // ======================================================

  const periodValues = [
    ...access.values,
    periodDays,
  ];

  const periodPosition =
    periodValues.length;

  const periodPromise =
    pool.query<PeriodRow>(
      `
        WITH accessible_tickets AS (
          SELECT
            t.id,
            t.created_at

          FROM tickets t

          WHERE ${access.where}
        ),

        dates AS (
          SELECT
            generate_series(
              CURRENT_DATE
                - (
                    $${periodPosition}::int
                    - 1
                  ),

              CURRENT_DATE,

              INTERVAL '1 day'
            )::date AS date
        )

        SELECT
          d.date::text
            AS date,

          COUNT(
            a.id
          )::int
            AS total

        FROM dates d

        LEFT JOIN accessible_tickets a
          ON a.created_at >= d.date

          AND a.created_at <
            (
              d.date
              + INTERVAL '1 day'
            )

        GROUP BY
          d.date

        ORDER BY
          d.date ASC;
      `,
      periodValues
    );

  // ======================================================
  // AGENT RANKING
  // ======================================================

  const rankingPromise:
    Promise<{
      rows:
        AgentRankingRow[];
    }> =
    role === "REQUESTER"
      ? Promise.resolve({
          rows: [],
        })
      : pool.query<AgentRankingRow>(
          `
            SELECT
              u.id
                AS agent_id,

              u.name
                AS agent_name,

              COUNT(
                t.id
              )::int
                AS resolved_tickets,

              ROUND(
                AVG(
                  EXTRACT(
                    EPOCH FROM (
                      t.resolved_at -
                      t.created_at
                    )
                  ) / 3600
                )::numeric,
                2
              )::float8
                AS average_resolution_hours

            FROM tickets t

            INNER JOIN users u
              ON u.company_id =
                  t.company_id

              AND u.id =
                  t.assignee_id

              AND u.role =
                  'AGENT'

            WHERE ${access.where}

              AND t.resolved_at
                IS NOT NULL

            GROUP BY
              u.id,
              u.name

            ORDER BY
              resolved_tickets DESC,

              average_resolution_hours
                ASC

            LIMIT 10;
          `,
          access.values
        );

  // ======================================================
  // PARALLEL DATABASE QUERIES
  // ======================================================

  const [
    summaryResult,
    statusResult,
    priorityResult,
    categoryResult,
    periodResult,
    rankingResult,
  ] = await Promise.all([
    summaryPromise,
    statusPromise,
    priorityPromise,
    categoryPromise,
    periodPromise,
    rankingPromise,
  ]);

  // ======================================================
  // SUMMARY
  // ======================================================

  const summary =
    summaryResult.rows[0];

  // ======================================================
  // RESPONSE
  // ======================================================

  return {
    summary: {
      totalTickets:
        summary.total_tickets,

      openTickets:
        summary.open_tickets,

      inProgressTickets:
        summary.in_progress_tickets,

      waitingCustomerTickets:
        summary
          .waiting_customer_tickets,

      resolvedTickets:
        summary.resolved_tickets,

      closedTickets:
        summary.closed_tickets,

      urgentTickets:
        summary.urgent_tickets,

      unassignedTickets:
        summary.unassigned_tickets,

      averageResolutionHours:
        summary
          .average_resolution_hours,
    },

    byStatus:
      statusResult.rows.map(
        (row) => ({
          status:
            row.status,

          total:
            row.total,
        })
      ),

    byPriority:
      priorityResult.rows.map(
        (row) => ({
          priority:
            row.priority,

          total:
            row.total,
        })
      ),

    byCategory:
      categoryResult.rows.map(
        (row) => ({
          categoryId:
            row.category_id,

          categoryName:
            row.category_name,

          total:
            row.total,
        })
      ),

    byPeriod:
      periodResult.rows.map(
        (row) => ({
          date:
            row.date,

          total:
            row.total,
        })
      ),

    agentRanking:
      rankingResult.rows.map(
        (row) => ({
          agentId:
            row.agent_id,

          agentName:
            row.agent_name,

          resolvedTickets:
            row.resolved_tickets,

          averageResolutionHours:
            row
              .average_resolution_hours,
        })
      ),

    periodDays,
  };
}