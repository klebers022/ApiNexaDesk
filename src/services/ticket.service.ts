import { PoolClient } from "pg";

import { pool } from "../database/connection";

import {
  CreateTicketCommentInput,  
  AssignTicketInput,
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from "../schemas/ticket.schema";

// ======================================================
// TYPES
// ======================================================

type UserRole =
  | "ADMIN"
  | "AGENT"
  | "REQUESTER";

type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_CUSTOMER"
  | "RESOLVED"
  | "CLOSED";

type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

// ======================================================
// DATABASE TYPES
// ======================================================

interface DatabaseTicket {
  id: string;
  company_id: string;

  ticket_number: string;

  title: string;
  description: string;

  status: TicketStatus;
  priority: TicketPriority;

  requester_id: string;
  requester_name: string;

  assignee_id: string | null;
  assignee_name: string | null;

  team_id: string | null;
  team_name: string | null;

  category_id: string;
  category_name: string;

  created_at: Date;
  updated_at: Date;

  resolved_at: Date | null;
  closed_at: Date | null;
}

interface EditableDatabaseTicket {
  id: string;
  company_id: string;

  title: string;
  description: string;

  status: TicketStatus;
  priority: TicketPriority;

  category_id: string;

  team_id: string | null;
  assignee_id: string | null;

  resolved_at: Date | null;
  closed_at: Date | null;
}

interface CountResult {
  total: string;
}

// ======================================================
// MAP TICKET
// ======================================================

function mapTicket(
  ticket: DatabaseTicket
) {
  return {
    id:
      ticket.id,

    companyId:
      ticket.company_id,

    ticketNumber:
      ticket.ticket_number,

    title:
      ticket.title,

    description:
      ticket.description,

    status:
      ticket.status,

    priority:
      ticket.priority,

    requester: {
      id:
        ticket.requester_id,

      name:
        ticket.requester_name,
    },

    assignee:
      ticket.assignee_id
        ? {
            id:
              ticket.assignee_id,

            name:
              ticket.assignee_name,
          }
        : null,

    team:
      ticket.team_id
        ? {
            id:
              ticket.team_id,

            name:
              ticket.team_name,
          }
        : null,

    category: {
      id:
        ticket.category_id,

      name:
        ticket.category_name,
    },

    createdAt:
      ticket.created_at,

    updatedAt:
      ticket.updated_at,

    resolvedAt:
      ticket.resolved_at,

    closedAt:
      ticket.closed_at,
  };
}

// ======================================================
// LIST TICKETS
// ======================================================

interface ListTicketsParams
  extends ListTicketsQuery {
  companyId: string;
  userId: string;
  role: UserRole;
}

export async function listTickets({
  companyId,
  userId,
  role,

  page,
  pageSize,

  search,
  status,
  priority,
  categoryId,
  teamId,
  assigneeId,
}: ListTicketsParams) {
  const conditions: string[] = [
    "t.company_id = $1",
  ];

  const values: unknown[] = [
    companyId,
  ];

  // ======================================================
  // PERMISSIONS
  // ======================================================

  if (role === "REQUESTER") {
    values.push(userId);

    conditions.push(
      `t.requester_id = $${values.length}`
    );
  }

  if (role === "AGENT") {
    values.push(userId);

    const userPosition =
      values.length;

    conditions.push(`
      (
        t.assignee_id = $${userPosition}

        OR t.team_id IN (
          SELECT tm.team_id

          FROM team_members tm

          WHERE tm.company_id = $1
            AND tm.user_id = $${userPosition}
        )
      )
    `);
  }

  // ADMIN não recebe filtro adicional.

  // ======================================================
  // FILTERS
  // ======================================================

  if (status) {
    values.push(status);

    conditions.push(
      `t.status = $${values.length}`
    );
  }

  if (priority) {
    values.push(priority);

    conditions.push(
      `t.priority = $${values.length}`
    );
  }

  if (categoryId) {
    values.push(categoryId);

    conditions.push(
      `t.category_id = $${values.length}`
    );
  }

  if (teamId) {
    values.push(teamId);

    conditions.push(
      `t.team_id = $${values.length}`
    );
  }

  if (assigneeId) {
    values.push(assigneeId);

    conditions.push(
      `t.assignee_id = $${values.length}`
    );
  }

  if (search) {
    values.push(
      `%${search}%`
    );

    const position =
      values.length;

    conditions.push(`
      (
        t.ticket_number ILIKE $${position}
        OR t.title ILIKE $${position}
        OR t.description ILIKE $${position}
      )
    `);
  }

  const whereClause =
    conditions.join(" AND ");

  // ======================================================
  // COUNT
  // ======================================================

  const countResult =
    await pool.query<CountResult>(
      `
        SELECT COUNT(*) AS total

        FROM tickets t

        WHERE ${whereClause};
      `,
      values
    );

  const total =
    Number(
      countResult.rows[0].total
    );

  const offset =
    (page - 1) * pageSize;

  // ======================================================
  // PAGINATION
  // ======================================================

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
    await pool.query<DatabaseTicket>(
      `
        SELECT
          t.id,
          t.company_id,
          t.ticket_number,
          t.title,
          t.description,
          t.status,
          t.priority,

          t.requester_id,
          requester.name AS requester_name,

          t.assignee_id,
          assignee.name AS assignee_name,

          t.team_id,
          tm.name AS team_name,

          t.category_id,
          cat.name AS category_name,

          t.created_at,
          t.updated_at,
          t.resolved_at,
          t.closed_at

        FROM tickets t

        INNER JOIN users requester
          ON requester.company_id = t.company_id
          AND requester.id = t.requester_id

        LEFT JOIN users assignee
          ON assignee.company_id = t.company_id
          AND assignee.id = t.assignee_id

        LEFT JOIN teams tm
          ON tm.company_id = t.company_id
          AND tm.id = t.team_id

        INNER JOIN categories cat
          ON cat.company_id = t.company_id
          AND cat.id = t.category_id

        WHERE ${whereClause}

        ORDER BY t.created_at DESC

        LIMIT $${limitPosition}
        OFFSET $${offsetPosition};
      `,
      dataValues
    );

  const tickets =
    result.rows.map(
      mapTicket
    );

  return {
    tickets,

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
// GET TICKET BY ID
// ======================================================

interface GetTicketByIdParams {
  ticketId: string;
  companyId: string;
  userId: string;
  role: UserRole;
}

export async function getTicketById({
  ticketId,
  companyId,
  userId,
  role,
}: GetTicketByIdParams) {
  const conditions = [
    "t.id = $1",
    "t.company_id = $2",
  ];

  const values: unknown[] = [
    ticketId,
    companyId,
  ];

  // ======================================================
  // REQUESTER
  // ======================================================

  if (role === "REQUESTER") {
    values.push(userId);

    conditions.push(
      `t.requester_id = $${values.length}`
    );
  }

  // ======================================================
  // AGENT
  // ======================================================

  if (role === "AGENT") {
    values.push(userId);

    const userPosition =
      values.length;

    conditions.push(`
      (
        t.assignee_id = $${userPosition}

        OR t.team_id IN (
          SELECT tm.team_id

          FROM team_members tm

          WHERE tm.company_id = $2
            AND tm.user_id = $${userPosition}
        )
      )
    `);
  }

  const result =
    await pool.query<DatabaseTicket>(
      `
        SELECT
          t.id,
          t.company_id,
          t.ticket_number,
          t.title,
          t.description,
          t.status,
          t.priority,

          t.requester_id,
          requester.name AS requester_name,

          t.assignee_id,
          assignee.name AS assignee_name,

          t.team_id,
          tm.name AS team_name,

          t.category_id,
          cat.name AS category_name,

          t.created_at,
          t.updated_at,
          t.resolved_at,
          t.closed_at

        FROM tickets t

        INNER JOIN users requester
          ON requester.company_id = t.company_id
          AND requester.id = t.requester_id

        LEFT JOIN users assignee
          ON assignee.company_id = t.company_id
          AND assignee.id = t.assignee_id

        LEFT JOIN teams tm
          ON tm.company_id = t.company_id
          AND tm.id = t.team_id

        INNER JOIN categories cat
          ON cat.company_id = t.company_id
          AND cat.id = t.category_id

        WHERE ${conditions.join(
          " AND "
        )}

        LIMIT 1;
      `,
      values
    );

  const ticket =
    result.rows[0];

  if (!ticket) {
    return null;
  }

  return mapTicket(ticket);
}

// ======================================================
// CREATE TICKET
// ======================================================

interface CreateTicketParams
  extends CreateTicketInput {
  companyId: string;

  authenticatedUserId: string;

  authenticatedUserRole:
    UserRole;
}

export async function createTicket({
  companyId,

  authenticatedUserId,
  authenticatedUserRole,

  title,
  description,
  priority,

  categoryId,
  requesterId,

  teamId,
  assigneeId,
}: CreateTicketParams) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    // ======================================================
    // REQUESTER
    // ======================================================

    const finalRequesterId =
      authenticatedUserRole ===
      "REQUESTER"
        ? authenticatedUserId
        : requesterId;

    if (!finalRequesterId) {
      throw new Error(
        "REQUESTER_REQUIRED"
      );
    }

    const requesterResult =
      await client.query<{
        id: string;
      }>(
        `
          SELECT id

          FROM users

          WHERE id = $1
            AND company_id = $2
            AND role = 'REQUESTER'
            AND status = 'ACTIVE'

          LIMIT 1;
        `,
        [
          finalRequesterId,
          companyId,
        ]
      );

    if (!requesterResult.rows[0]) {
      throw new Error(
        "REQUESTER_NOT_FOUND"
      );
    }

    // ======================================================
    // CATEGORY
    // ======================================================

    const categoryResult =
      await client.query<{
        id: string;
      }>(
        `
          SELECT id

          FROM categories

          WHERE id = $1
            AND company_id = $2
            AND status = 'ACTIVE'

          LIMIT 1;
        `,
        [
          categoryId,
          companyId,
        ]
      );

    if (!categoryResult.rows[0]) {
      throw new Error(
        "CATEGORY_NOT_FOUND"
      );
    }

    // ======================================================
    // TEAM
    // ======================================================

    if (teamId) {
      const teamResult =
        await client.query<{
          id: string;
        }>(
          `
            SELECT id

            FROM teams

            WHERE id = $1
              AND company_id = $2

            LIMIT 1;
          `,
          [
            teamId,
            companyId,
          ]
        );

      if (!teamResult.rows[0]) {
        throw new Error(
          "TEAM_NOT_FOUND"
        );
      }
    }

    // ======================================================
    // ASSIGNEE
    // ======================================================

    if (assigneeId) {
      const assigneeResult =
        await client.query<{
          id: string;
        }>(
          `
            SELECT id

            FROM users

            WHERE id = $1
              AND company_id = $2
              AND role = 'AGENT'
              AND status = 'ACTIVE'

            LIMIT 1;
          `,
          [
            assigneeId,
            companyId,
          ]
        );

      if (!assigneeResult.rows[0]) {
        throw new Error(
          "ASSIGNEE_NOT_FOUND"
        );
      }

      // ====================================================
      // SE INFORMOU EQUIPE, O AGENT PRECISA PERTENCER A ELA
      // ====================================================

      if (teamId) {
        const membership =
          await client.query<{
            id: string;
          }>(
            `
              SELECT id

              FROM team_members

              WHERE company_id = $1
                AND team_id = $2
                AND user_id = $3

              LIMIT 1;
            `,
            [
              companyId,
              teamId,
              assigneeId,
            ]
          );

        if (!membership.rows[0]) {
          throw new Error(
            "ASSIGNEE_NOT_IN_TEAM"
          );
        }
      }
    }

    // ======================================================
    // INSERT
    // ======================================================

    const result =
      await client.query<{
        id: string;
        ticket_number: string;

        status: TicketStatus;
        priority: TicketPriority;

        created_at: Date;
      }>(
        `
          INSERT INTO tickets (
            company_id,
            title,
            description,
            priority,
            requester_id,
            assignee_id,
            team_id,
            category_id
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )

          RETURNING
            id,
            ticket_number,
            status,
            priority,
            created_at;
        `,
        [
          companyId,
          title,
          description,
          priority,
          finalRequesterId,
          assigneeId ?? null,
          teamId ?? null,
          categoryId,
        ]
      );

    const ticket =
      result.rows[0];

    // ======================================================
    // HISTORY
    // ======================================================

    await client.query(
      `
        INSERT INTO ticket_history (
          company_id,
          ticket_id,
          user_id,
          action,
          old_value,
          new_value
        )

        VALUES (
          $1,
          $2,
          $3,
          'TICKET_CREATED',
          NULL,
          $4
        );
      `,
      [
        companyId,
        ticket.id,
        authenticatedUserId,
        ticket.ticket_number,
      ]
    );

    await client.query(
      "COMMIT"
    );

    return {
      id:
        ticket.id,

      ticketNumber:
        ticket.ticket_number,

      title,
      description,

      status:
        ticket.status,

      priority:
        ticket.priority,

      requesterId:
        finalRequesterId,

      assigneeId:
        assigneeId ?? null,

      teamId:
        teamId ?? null,

      categoryId,

      createdAt:
        ticket.created_at,
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

// ======================================================
// FIND ACCESSIBLE TICKET
// Usado nas operações de edição.
// ======================================================

async function findAccessibleTicket(
  client: PoolClient,
  {
    ticketId,
    companyId,
    userId,
    role,
  }: {
    ticketId: string;
    companyId: string;
    userId: string;
    role: UserRole;
  }
) {
  const conditions: string[] = [
    "t.id = $1",
    "t.company_id = $2",
  ];

  const values: unknown[] = [
    ticketId,
    companyId,
  ];

  // ======================================================
  // REQUESTER
  // ======================================================

  if (role === "REQUESTER") {
    values.push(userId);

    conditions.push(
      `t.requester_id = $${values.length}`
    );
  }

  // ======================================================
  // AGENT
  // ======================================================

  if (role === "AGENT") {
    values.push(userId);

    const userPosition =
      values.length;

    conditions.push(`
      (
        t.assignee_id = $${userPosition}

        OR t.team_id IN (
          SELECT tm.team_id

          FROM team_members tm

          WHERE tm.company_id = $2
            AND tm.user_id = $${userPosition}
        )
      )
    `);
  }

  const result =
    await client.query<EditableDatabaseTicket>(
      `
        SELECT
          t.id,
          t.company_id,

          t.title,
          t.description,

          t.status,
          t.priority,

          t.category_id,

          t.team_id,
          t.assignee_id,

          t.resolved_at,
          t.closed_at

        FROM tickets t

        WHERE ${conditions.join(
          " AND "
        )}

        LIMIT 1

        FOR UPDATE;
      `,
      values
    );

  return (
    result.rows[0] ??
    null
  );
}

// ======================================================
// UPDATE TICKET
// ======================================================

interface UpdateTicketParams
  extends UpdateTicketInput {
  ticketId: string;
  companyId: string;

  authenticatedUserId: string;
  authenticatedUserRole: UserRole;
}

export async function updateTicket({
  ticketId,
  companyId,

  authenticatedUserId,
  authenticatedUserRole,

  title,
  description,
  priority,
  categoryId,
}: UpdateTicketParams) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const current =
      await findAccessibleTicket(
        client,
        {
          ticketId,
          companyId,

          userId:
            authenticatedUserId,

          role:
            authenticatedUserRole,
        }
      );

    if (!current) {
      throw new Error(
        "TICKET_NOT_FOUND"
      );
    }

    // ======================================================
    // VALIDATE CATEGORY
    // ======================================================

    if (
      categoryId !== undefined
    ) {
      const categoryResult =
        await client.query<{
          id: string;
        }>(
          `
            SELECT id

            FROM categories

            WHERE id = $1
              AND company_id = $2
              AND status = 'ACTIVE'

            LIMIT 1;
          `,
          [
            categoryId,
            companyId,
          ]
        );

      if (!categoryResult.rows[0]) {
        throw new Error(
          "CATEGORY_NOT_FOUND"
        );
      }
    }

    // ======================================================
    // FINAL VALUES
    // ======================================================

    const finalTitle =
      title ??
      current.title;

    const finalDescription =
      description ??
      current.description;

    const finalPriority =
      priority ??
      current.priority;

    const finalCategoryId =
      categoryId ??
      current.category_id;

    // ======================================================
    // UPDATE
    // ======================================================

    const result =
      await client.query<{
        id: string;
        ticket_number: string;

        title: string;
        description: string;

        status: TicketStatus;
        priority: TicketPriority;

        category_id: string;

        team_id: string | null;
        assignee_id: string | null;

        created_at: Date;
        updated_at: Date;
      }>(
        `
          UPDATE tickets

          SET
            title = $1,
            description = $2,
            priority = $3,
            category_id = $4

          WHERE id = $5
            AND company_id = $6

          RETURNING
            id,
            ticket_number,
            title,
            description,
            status,
            priority,
            category_id,
            team_id,
            assignee_id,
            created_at,
            updated_at;
        `,
        [
          finalTitle,
          finalDescription,
          finalPriority,
          finalCategoryId,

          ticketId,
          companyId,
        ]
      );

    // ======================================================
    // TITLE HISTORY
    // ======================================================

   

    // ======================================================
    // DESCRIPTION HISTORY
    // ======================================================

   
   // ======================================================
// PRIORITY HISTORY
// ======================================================

if (
  priority !== undefined &&
  priority !== current.priority
) {
  await client.query(
    `
      INSERT INTO ticket_history (
        company_id,
        ticket_id,
        user_id,
        action,
        old_value,
        new_value
      )

      VALUES (
        $1,
        $2,
        $3,
        'PRIORITY_CHANGED',
        $4,
        $5
      );
    `,
    [
      companyId,
      ticketId,
      authenticatedUserId,
      current.priority,
      priority,
    ]
  );
}

// ======================================================
// CATEGORY HISTORY
// ======================================================

if (
  categoryId !== undefined &&
  categoryId !== current.category_id
) {
  await client.query(
    `
      INSERT INTO ticket_history (
        company_id,
        ticket_id,
        user_id,
        action,
        old_value,
        new_value
      )

      VALUES (
        $1,
        $2,
        $3,
        'CATEGORY_CHANGED',
        $4,
        $5
      );
    `,
    [
      companyId,
      ticketId,
      authenticatedUserId,
      current.category_id,
      categoryId,
    ]
  );
}

    await client.query(
      "COMMIT"
    );

    const ticket =
      result.rows[0];

    return {
      id:
        ticket.id,

      ticketNumber:
        ticket.ticket_number,

      title:
        ticket.title,

      description:
        ticket.description,

      status:
        ticket.status,

      priority:
        ticket.priority,

      categoryId:
        ticket.category_id,

      teamId:
        ticket.team_id,

      assigneeId:
        ticket.assignee_id,

      createdAt:
        ticket.created_at,

      updatedAt:
        ticket.updated_at,
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

// ======================================================
// ASSIGN TICKET
// ======================================================

interface AssignTicketParams
  extends AssignTicketInput {
  ticketId: string;
  companyId: string;

  authenticatedUserId: string;
  authenticatedUserRole: UserRole;
}

export async function assignTicket({
  ticketId,
  companyId,

  authenticatedUserId,
  authenticatedUserRole,

  teamId,
  assigneeId,
}: AssignTicketParams) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const current =
      await findAccessibleTicket(
        client,
        {
          ticketId,
          companyId,

          userId:
            authenticatedUserId,

          role:
            authenticatedUserRole,
        }
      );

    if (!current) {
      throw new Error(
        "TICKET_NOT_FOUND"
      );
    }

    // ======================================================
    // FINAL VALUES
    // ======================================================

    const finalTeamId =
      teamId !== undefined
        ? teamId
        : current.team_id;

    const finalAssigneeId =
      assigneeId !== undefined
        ? assigneeId
        : current.assignee_id;

    // ======================================================
    // TEAM
    // ======================================================

    if (finalTeamId) {
      const teamResult =
        await client.query<{
          id: string;
        }>(
          `
            SELECT id

            FROM teams

            WHERE id = $1
              AND company_id = $2

            LIMIT 1;
          `,
          [
            finalTeamId,
            companyId,
          ]
        );

      if (!teamResult.rows[0]) {
        throw new Error(
          "TEAM_NOT_FOUND"
        );
      }
    }

    // ======================================================
    // ASSIGNEE
    // ======================================================

    if (finalAssigneeId) {
      const agentResult =
        await client.query<{
          id: string;
        }>(
          `
            SELECT id

            FROM users

            WHERE id = $1
              AND company_id = $2
              AND role = 'AGENT'
              AND status = 'ACTIVE'

            LIMIT 1;
          `,
          [
            finalAssigneeId,
            companyId,
          ]
        );

      if (!agentResult.rows[0]) {
        throw new Error(
          "ASSIGNEE_NOT_FOUND"
        );
      }
    }

    // ======================================================
    // AGENT MUST BELONG TO TEAM
    // ======================================================

    if (
      finalTeamId &&
      finalAssigneeId
    ) {
      const membership =
        await client.query<{
          id: string;
        }>(
          `
            SELECT id

            FROM team_members

            WHERE company_id = $1
              AND team_id = $2
              AND user_id = $3

            LIMIT 1;
          `,
          [
            companyId,
            finalTeamId,
            finalAssigneeId,
          ]
        );

      if (!membership.rows[0]) {
        throw new Error(
          "ASSIGNEE_NOT_IN_TEAM"
        );
      }
    }

    // ======================================================
    // UPDATE
    // ======================================================

    const result =
      await client.query<{
        id: string;
        ticket_number: string;

        team_id: string | null;
        assignee_id: string | null;

        status: TicketStatus;
        updated_at: Date;
      }>(
        `
          UPDATE tickets

          SET
            team_id = $1,
            assignee_id = $2

          WHERE id = $3
            AND company_id = $4

          RETURNING
            id,
            ticket_number,
            team_id,
            assignee_id,
            status,
            updated_at;
        `,
        [
          finalTeamId,
          finalAssigneeId,

          ticketId,
          companyId,
        ]
      );

    // ======================================================
    // TEAM HISTORY
    // ======================================================

    if (
      finalTeamId !==
      current.team_id
    ) {
      await client.query(
        `
          INSERT INTO ticket_history (
            company_id,
            ticket_id,
            user_id,
            action,
            old_value,
            new_value
          )

          VALUES (
            $1,
            $2,
            $3,
            'TEAM_CHANGED',
            $4,
            $5
          );
        `,
        [
          companyId,
          ticketId,
          authenticatedUserId,

          current.team_id,
          finalTeamId,
        ]
      );
    }

    // ======================================================
    // ASSIGNEE HISTORY
    // ======================================================

    if (
      finalAssigneeId !==
      current.assignee_id
    ) {
      await client.query(
        `
          INSERT INTO ticket_history (
            company_id,
            ticket_id,
            user_id,
            action,
            old_value,
            new_value
          )

          VALUES (
            $1,
            $2,
            $3,
            'ASSIGNEE_CHANGED',
            $4,
            $5
          );
        `,
        [
          companyId,
          ticketId,
          authenticatedUserId,

          current.assignee_id,
          finalAssigneeId,
        ]
      );
    }

    await client.query(
      "COMMIT"
    );

    const ticket =
      result.rows[0];

    return {
      id:
        ticket.id,

      ticketNumber:
        ticket.ticket_number,

      teamId:
        ticket.team_id,

      assigneeId:
        ticket.assignee_id,

      status:
        ticket.status,

      updatedAt:
        ticket.updated_at,
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

// ======================================================
// STATUS MACHINE
// ======================================================

const allowedTransitions:
  Record<
    TicketStatus,
    TicketStatus[]
  > = {
  OPEN: [
    "IN_PROGRESS",
  ],

  IN_PROGRESS: [
    "WAITING_CUSTOMER",
    "RESOLVED",
  ],

  WAITING_CUSTOMER: [
    "IN_PROGRESS",
    "RESOLVED",
  ],

  RESOLVED: [
    "CLOSED",
    "IN_PROGRESS",
  ],

  CLOSED: [
    "IN_PROGRESS",
  ],
};

// ======================================================
// CHANGE STATUS
// ======================================================

interface ChangeTicketStatusParams {
  ticketId: string;
  companyId: string;

  authenticatedUserId: string;
  authenticatedUserRole: UserRole;

  status: TicketStatus;
}

export async function changeTicketStatus({
  ticketId,
  companyId,

  authenticatedUserId,
  authenticatedUserRole,

  status,
}: ChangeTicketStatusParams) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const current =
      await findAccessibleTicket(
        client,
        {
          ticketId,
          companyId,

          userId:
            authenticatedUserId,

          role:
            authenticatedUserRole,
        }
      );

    if (!current) {
      throw new Error(
        "TICKET_NOT_FOUND"
      );
    }

    const currentStatus =
      current.status;

    // ======================================================
    // SAME STATUS
    // ======================================================

    if (
      currentStatus === status
    ) {
      throw new Error(
        "INVALID_STATUS_TRANSITION"
      );
    }

    // ======================================================
    // VALIDATE TRANSITION
    // ======================================================

    const possibleStatuses =
      allowedTransitions[
        currentStatus
      ];

    if (
      !possibleStatuses.includes(
        status
      )
    ) {
      throw new Error(
        "INVALID_STATUS_TRANSITION"
      );
    }

    // ======================================================
    // TIMESTAMPS
    // ======================================================

    let resolvedAt =
      current.resolved_at;

    let closedAt =
      current.closed_at;

    // Quando resolver
    if (
      status === "RESOLVED"
    ) {
      resolvedAt =
        new Date();

      closedAt =
        null;
    }

    // Quando fechar
    if (
      status === "CLOSED"
    ) {
      closedAt =
        new Date();
    }

    // Quando reabrir
    if (
      status === "IN_PROGRESS" &&
      (
        currentStatus ===
          "RESOLVED" ||
        currentStatus ===
          "CLOSED"
      )
    ) {
      resolvedAt =
        null;

      closedAt =
        null;
    }

    // ======================================================
    // UPDATE
    // ======================================================

    const result =
      await client.query<{
        id: string;
        ticket_number: string;

        status: TicketStatus;

        resolved_at: Date | null;
        closed_at: Date | null;

        updated_at: Date;
      }>(
        `
          UPDATE tickets

          SET
            status = $1,
            resolved_at = $2,
            closed_at = $3

          WHERE id = $4
            AND company_id = $5

          RETURNING
            id,
            ticket_number,
            status,
            resolved_at,
            closed_at,
            updated_at;
        `,
        [
          status,
          resolvedAt,
          closedAt,

          ticketId,
          companyId,
        ]
      );

    // ======================================================
    // HISTORY
    // ======================================================

    await client.query(
      `
        INSERT INTO ticket_history (
          company_id,
          ticket_id,
          user_id,
          action,
          old_value,
          new_value
        )

        VALUES (
          $1,
          $2,
          $3,
          'STATUS_CHANGED',
          $4,
          $5
        );
      `,
      [
        companyId,
        ticketId,
        authenticatedUserId,

        currentStatus,
        status,
      ]
    );

    await client.query(
      "COMMIT"
    );

    const ticket =
      result.rows[0];

    return {
      id:
        ticket.id,

      ticketNumber:
        ticket.ticket_number,

      status:
        ticket.status,

      resolvedAt:
        ticket.resolved_at,

      closedAt:
        ticket.closed_at,

      updatedAt:
        ticket.updated_at,
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

interface DatabaseTicketComment {
  id: string;

  company_id: string;
  ticket_id: string;
  user_id: string;

  user_name: string;
  user_role: UserRole;

  content: string;

  is_internal: boolean;

  created_at: Date;
  updated_at: Date;
}

interface ListTicketCommentsParams {
  ticketId: string;
  companyId: string;

  authenticatedUserId: string;
  authenticatedUserRole: UserRole;
}

export async function listTicketComments({
  ticketId,
  companyId,

  authenticatedUserId,
  authenticatedUserRole,
}: ListTicketCommentsParams) {
  // ======================================================
  // VALIDAR ACESSO AO TICKET
  // ======================================================

  const ticket =
    await getTicketById({
      ticketId,
      companyId,

      userId:
        authenticatedUserId,

      role:
        authenticatedUserRole,
    });

  if (!ticket) {
    throw new Error(
      "TICKET_NOT_FOUND"
    );
  }

  // ======================================================
  // FILTROS
  // ======================================================

  const conditions = [
    "tc.ticket_id = $1",
    "tc.company_id = $2",
  ];

  // REQUESTER nunca vê notas internas
  if (
    authenticatedUserRole ===
    "REQUESTER"
  ) {
    conditions.push(
      "tc.is_internal = FALSE"
    );
  }

  // ======================================================
  // COMMENTS
  // ======================================================

  const result =
    await pool.query<DatabaseTicketComment>(
      `
        SELECT
          tc.id,

          tc.company_id,
          tc.ticket_id,
          tc.user_id,

          u.name AS user_name,
          u.role AS user_role,

          tc.content,
          tc.is_internal,

          tc.created_at,
          tc.updated_at

        FROM ticket_comments tc

        INNER JOIN users u
          ON u.id = tc.user_id
          AND u.company_id =
              tc.company_id

        WHERE ${conditions.join(
          " AND "
        )}

        ORDER BY tc.created_at ASC;
      `,
      [
        ticketId,
        companyId,
      ]
    );

  return result.rows.map(
    (comment) => ({
      id:
        comment.id,

      ticketId:
        comment.ticket_id,

      author: {
        id:
          comment.user_id,

        name:
          comment.user_name,

        role:
          comment.user_role,
      },

      content:
        comment.content,

      isInternal:
        comment.is_internal,

      createdAt:
        comment.created_at,

      updatedAt:
        comment.updated_at,
    })
  );
}

interface CreateTicketCommentParams
  extends CreateTicketCommentInput {
  ticketId: string;
  companyId: string;

  authenticatedUserId: string;
  authenticatedUserRole: UserRole;
}

export async function createTicketComment({
  ticketId,
  companyId,

  authenticatedUserId,
  authenticatedUserRole,

  content,
  isInternal,
}: CreateTicketCommentParams) {
  // ======================================================
  // VALIDAR ACESSO AO TICKET
  // ======================================================

  const ticket =
    await getTicketById({
      ticketId,
      companyId,

      userId:
        authenticatedUserId,

      role:
        authenticatedUserRole,
    });

  if (!ticket) {
    throw new Error(
      "TICKET_NOT_FOUND"
    );
  }

  // ======================================================
  // REQUESTER NÃO PODE CRIAR NOTA INTERNA
  // ======================================================

  if (
    authenticatedUserRole ===
      "REQUESTER" &&
    isInternal
  ) {
    throw new Error(
      "INTERNAL_COMMENT_FORBIDDEN"
    );
  }

  // ======================================================
  // INSERT COMMENT
  // ======================================================

  const result =
    await pool.query<DatabaseTicketComment>(
      `
        WITH inserted_comment AS (
          INSERT INTO ticket_comments (
            company_id,
            ticket_id,
            user_id,
            content,
            is_internal
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
            ticket_id,
            user_id,
            content,
            is_internal,
            created_at,
            updated_at
        )

        SELECT
          ic.id,

          ic.company_id,
          ic.ticket_id,
          ic.user_id,

          u.name AS user_name,
          u.role AS user_role,

          ic.content,
          ic.is_internal,

          ic.created_at,
          ic.updated_at

        FROM inserted_comment ic

        INNER JOIN users u
          ON u.id = ic.user_id
          AND u.company_id =
              ic.company_id;
      `,
      [
        companyId,
        ticketId,
        authenticatedUserId,
        content,
        isInternal,
      ]
    );

  const comment =
    result.rows[0];

  return {
    id:
      comment.id,

    ticketId:
      comment.ticket_id,

    author: {
      id:
        comment.user_id,

      name:
        comment.user_name,

      role:
        comment.user_role,
    },

    content:
      comment.content,

    isInternal:
      comment.is_internal,

    createdAt:
      comment.created_at,

    updatedAt:
      comment.updated_at,
  };
}

  // ======================================================
  // INSERT COMMENT + AUTHOR
  // ======================================================

  

interface DatabaseTicketHistory {
  id: string;

  company_id: string;
  ticket_id: string;

  user_id: string | null;
  user_name: string | null;
  user_role: UserRole | null;

  action: string;

  old_value: string | null;
  new_value: string | null;

  created_at: Date;
}

interface ListTicketHistoryParams {
  ticketId: string;
  companyId: string;

  authenticatedUserId: string;
  authenticatedUserRole: UserRole;
}

export async function listTicketHistory({
  ticketId,
  companyId,

  authenticatedUserId,
  authenticatedUserRole,
}: ListTicketHistoryParams) {
  // ======================================================
  // VALIDAR ACESSO
  // ======================================================

  const ticket =
    await getTicketById({
      ticketId,
      companyId,

      userId:
        authenticatedUserId,

      role:
        authenticatedUserRole,
    });

  if (!ticket) {
    throw new Error(
      "TICKET_NOT_FOUND"
    );
  }

  // ======================================================
  // HISTORY
  // ======================================================

  const result =
    await pool.query<DatabaseTicketHistory>(
      `
        SELECT
          th.id,

          th.company_id,
          th.ticket_id,

          th.user_id,

          u.name AS user_name,
          u.role AS user_role,

          th.action,

          th.old_value,
          th.new_value,

          th.created_at

        FROM ticket_history th

        LEFT JOIN users u
          ON u.id = th.user_id
          AND u.company_id =
              th.company_id

        WHERE th.ticket_id = $1
          AND th.company_id = $2

        ORDER BY th.created_at ASC;
      `,
      [
        ticketId,
        companyId,
      ]
    );

  return result.rows.map(
    (history) => ({
      id:
        history.id,

      ticketId:
        history.ticket_id,

      action:
        history.action,

      oldValue:
        history.old_value,

      newValue:
        history.new_value,

      changedBy:
        history.user_id
          ? {
              id:
                history.user_id,

              name:
                history.user_name,

              role:
                history.user_role,
            }
          : null,

      createdAt:
        history.created_at,
    })
  );
}

