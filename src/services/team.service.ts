import { pool } from "../database/connection";

import {
  CreateTeamInput,
  ListTeamsQuery,
  UpdateTeamInput,
} from "../schemas/team.schema";

interface DatabaseTeam {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

interface DatabaseTeamWithCount extends DatabaseTeam {
  member_count: string;
}

interface CountResult {
  total: string;
}

// ======================================================
// LIST
// ======================================================

interface ListTeamsParams extends ListTeamsQuery {
  companyId: string;
}

export async function listTeams({
  companyId,
  page,
  pageSize,
  search,
}: ListTeamsParams) {
  const conditions = ["t.company_id = $1"];

  const values: unknown[] = [companyId];

  if (search) {
    values.push(`%${search}%`);

    const position = values.length;

    conditions.push(`
      (
        t.name ILIKE $${position}
        OR t.description ILIKE $${position}
      )
    `);
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query<CountResult>(
    `
        SELECT COUNT(*) AS total
        FROM teams t
        WHERE ${whereClause};
      `,
    values,
  );

  const total = Number(countResult.rows[0].total);

  const offset = (page - 1) * pageSize;

  const dataValues = [...values, pageSize, offset];

  const limitPosition = dataValues.length - 1;

  const offsetPosition = dataValues.length;

  const result = await pool.query<DatabaseTeamWithCount>(
    `
        SELECT
          t.id,
          t.company_id,
          t.name,
          t.description,
          t.created_at,
          t.updated_at,
          COUNT(tm.id)::text AS member_count

        FROM teams t

        LEFT JOIN team_members tm
          ON tm.team_id = t.id

        WHERE ${whereClause}

        GROUP BY
          t.id,
          t.company_id,
          t.name,
          t.description,
          t.created_at,
          t.updated_at

        ORDER BY t.name ASC

        LIMIT $${limitPosition}
        OFFSET $${offsetPosition};
      `,
    dataValues,
  );

  const teams = result.rows.map((team) => ({
    id: team.id,
    companyId: team.company_id,

    name: team.name,
    description: team.description,

    memberCount: Number(team.member_count),

    createdAt: team.created_at,
    updatedAt: team.updated_at,
  }));

  return {
    teams,

    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ======================================================
// GET BY ID
// ======================================================

interface GetTeamByIdParams {
  teamId: string;
  companyId: string;
}

export async function getTeamById({ teamId, companyId }: GetTeamByIdParams) {
  const result = await pool.query<DatabaseTeamWithCount>(
    `
        SELECT
          t.id,
          t.company_id,
          t.name,
          t.description,
          t.created_at,
          t.updated_at,
          COUNT(tm.id)::text AS member_count

        FROM teams t

        LEFT JOIN team_members tm
          ON tm.team_id = t.id

        WHERE t.id = $1
          AND t.company_id = $2

        GROUP BY
          t.id,
          t.company_id,
          t.name,
          t.description,
          t.created_at,
          t.updated_at

        LIMIT 1;
      `,
    [teamId, companyId],
  );

  const team = result.rows[0];

  if (!team) {
    return null;
  }

  return {
    id: team.id,
    companyId: team.company_id,

    name: team.name,
    description: team.description,

    memberCount: Number(team.member_count),

    createdAt: team.created_at,
    updatedAt: team.updated_at,
  };
}

// ======================================================
// CREATE
// ======================================================

interface CreateTeamParams extends CreateTeamInput {
  companyId: string;
}

export async function createTeam({
  companyId,
  name,
  description,
}: CreateTeamParams) {
  const existing = await pool.query<{ id: string }>(
    `
        SELECT id
        FROM teams

        WHERE company_id = $1
          AND LOWER(name) = LOWER($2)

        LIMIT 1;
      `,
    [companyId, name],
  );

  if (existing.rows[0]) {
    throw new Error("TEAM_NAME_ALREADY_EXISTS");
  }

  const result = await pool.query<DatabaseTeam>(
    `
        INSERT INTO teams (
          company_id,
          name,
          description
        )

        VALUES (
          $1,
          $2,
          $3
        )

        RETURNING
          id,
          company_id,
          name,
          description,
          created_at,
          updated_at;
      `,
    [companyId, name, description ?? null],
  );

  const team = result.rows[0];

  return {
    id: team.id,
    companyId: team.company_id,

    name: team.name,
    description: team.description,

    memberCount: 0,

    createdAt: team.created_at,
    updatedAt: team.updated_at,
  };
}

// ======================================================
// UPDATE
// ======================================================

interface UpdateTeamParams extends UpdateTeamInput {
  teamId: string;
  companyId: string;
}

export async function updateTeam({
  teamId,
  companyId,
  name,
  description,
}: UpdateTeamParams) {
  const currentResult = await pool.query<DatabaseTeam>(
    `
        SELECT
          id,
          company_id,
          name,
          description,
          created_at,
          updated_at

        FROM teams

        WHERE id = $1
          AND company_id = $2

        LIMIT 1;
      `,
    [teamId, companyId],
  );

  const currentTeam = currentResult.rows[0];

  if (!currentTeam) {
    throw new Error("TEAM_NOT_FOUND");
  }

  if (name !== undefined) {
    const duplicateResult = await pool.query<{ id: string }>(
      `
          SELECT id
          FROM teams

          WHERE company_id = $1
            AND LOWER(name) = LOWER($2)
            AND id <> $3

          LIMIT 1;
        `,
      [companyId, name, teamId],
    );

    if (duplicateResult.rows[0]) {
      throw new Error("TEAM_NAME_ALREADY_EXISTS");
    }
  }

  const result = await pool.query<DatabaseTeam>(
    `
        UPDATE teams

        SET
          name = COALESCE($1, name),
          description = $2

        WHERE id = $3
          AND company_id = $4

        RETURNING
          id,
          company_id,
          name,
          description,
          created_at,
          updated_at;
      `,
    [
      name ?? null,

      description !== undefined ? description : currentTeam.description,

      teamId,
      companyId,
    ],
  );

  const team = result.rows[0];

  return {
    id: team.id,
    companyId: team.company_id,

    name: team.name,
    description: team.description,

    createdAt: team.created_at,
    updatedAt: team.updated_at,
  };
}

// ======================================================
// MEMBERS
// ======================================================

interface TeamParams {
  teamId: string;
  companyId: string;
}

export async function listTeamMembers({ teamId, companyId }: TeamParams) {
  const team = await pool.query<{ id: string }>(
    `
        SELECT id
        FROM teams

        WHERE id = $1
          AND company_id = $2

        LIMIT 1;
      `,
    [teamId, companyId],
  );

  if (!team.rows[0]) {
    throw new Error("TEAM_NOT_FOUND");
  }
  const result = await pool.query<{
    id: string;
    company_id: string;
    user_id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: Date;
  }>(
    `
      SELECT
        tm.id,
        tm.company_id,
        tm.user_id,

        u.name,
        u.email,
        u.role,
        u.status,

        tm.created_at

      FROM team_members tm

      INNER JOIN users u
        ON u.id = tm.user_id
        AND u.company_id = tm.company_id

      WHERE tm.team_id = $1
        AND tm.company_id = $2

      ORDER BY u.name ASC;
    `,
    [teamId, companyId],
  );

  return result.rows.map((member) => ({
    id: member.id,

    companyId: member.company_id,

    userId: member.user_id,

    name: member.name,

    email: member.email,

    role: member.role,

    status: member.status,

    joinedAt: member.created_at,
  }));
}

// ======================================================
// ADD MEMBER
// ======================================================

interface AddTeamMemberParams {
  teamId: string;
  userId: string;
  companyId: string;
}

export async function addTeamMember({
  teamId,
  userId,
  companyId,
}: AddTeamMemberParams) {
  // ======================================================
  // 1. VERIFICAR SE A EQUIPE EXISTE NA EMPRESA
  // ======================================================

  const teamResult = await pool.query<{ id: string }>(
    `
        SELECT id
        FROM teams

        WHERE id = $1
          AND company_id = $2

        LIMIT 1;
      `,
    [teamId, companyId],
  );

  if (!teamResult.rows[0]) {
    throw new Error("TEAM_NOT_FOUND");
  }

  // ======================================================
  // 2. VERIFICAR O USUÁRIO
  // ======================================================

  const userResult = await pool.query<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  }>(
    `
        SELECT
          id,
          name,
          email,
          role,
          status

        FROM users

        WHERE id = $1
          AND company_id = $2

        LIMIT 1;
      `,
    [userId, companyId],
  );

  const memberUser = userResult.rows[0];

  if (!memberUser) {
    throw new Error("USER_NOT_FOUND");
  }

  // ======================================================
  // 3. SOMENTE AGENT PODE ENTRAR EM EQUIPE
  // ======================================================

  if (memberUser.role !== "AGENT") {
    throw new Error("USER_MUST_BE_AGENT");
  }

  // ======================================================
  // 4. USUÁRIO PRECISA ESTAR ATIVO
  // ======================================================

  if (memberUser.status !== "ACTIVE") {
    throw new Error("USER_INACTIVE");
  }

  // ======================================================
  // 5. VERIFICAR SE JÁ É MEMBRO
  // ======================================================

  const existingResult = await pool.query<{ id: string }>(
    `
        SELECT id

        FROM team_members

        WHERE company_id = $1
          AND team_id = $2
          AND user_id = $3

        LIMIT 1;
      `,
    [companyId, teamId, userId],
  );

  if (existingResult.rows[0]) {
    throw new Error("TEAM_MEMBER_ALREADY_EXISTS");
  }

  // ======================================================
  // 6. ADICIONAR MEMBRO
  // ======================================================

  const result = await pool.query<{
    id: string;
    company_id: string;
    team_id: string;
    user_id: string;
    created_at: Date;
  }>(
    `
        INSERT INTO team_members (
          company_id,
          team_id,
          user_id
        )

        VALUES (
          $1,
          $2,
          $3
        )

        RETURNING
          id,
          company_id,
          team_id,
          user_id,
          created_at;
      `,
    [companyId, teamId, userId],
  );

  const member = result.rows[0];

  return {
    id: member.id,

    companyId: member.company_id,

    teamId: member.team_id,

    userId: member.user_id,

    name: memberUser.name,

    email: memberUser.email,

    role: memberUser.role,

    status: memberUser.status,

    createdAt: member.created_at,
  };
}

// ======================================================
// REMOVE MEMBER
// ======================================================
interface RemoveTeamMemberParams {
  teamId: string;
  userId: string;
  companyId: string;
}

export async function removeTeamMember({
  teamId,
  userId,
  companyId,
}: RemoveTeamMemberParams) {
  const result =
    await pool.query<{
      id: string;
      company_id: string;
      team_id: string;
      user_id: string;
    }>(
      `
        DELETE FROM team_members

        WHERE company_id = $1
          AND team_id = $2
          AND user_id = $3

        RETURNING
          id,
          company_id,
          team_id,
          user_id;
      `,
      [
        companyId,
        teamId,
        userId,
      ]
    );

  const member =
    result.rows[0];

  if (!member) {
    throw new Error(
      "TEAM_MEMBER_NOT_FOUND"
    );
  }

  return {
    id:
      member.id,

    companyId:
      member.company_id,

    teamId:
      member.team_id,

    userId:
      member.user_id,
  };
}

// ======================================================
// DELETE TEAM
// ======================================================

interface DeleteTeamParams {
  teamId: string;
  companyId: string;
}

export async function deleteTeam({ teamId, companyId }: DeleteTeamParams) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const teamResult = await client.query<{
      id: string;
    }>(
      `
          SELECT id

          FROM teams

          WHERE id = $1
            AND company_id = $2

          LIMIT 1;
        `,
      [teamId, companyId],
    );

    if (!teamResult.rows[0]) {
      throw new Error("TEAM_NOT_FOUND");
    }

    // Equipe com histórico de tickets
    // não deve ser excluída.
    const ticketsResult = await client.query<{
      total: string;
    }>(
      `
          SELECT COUNT(*) AS total

          FROM tickets

          WHERE team_id = $1
            AND company_id = $2;
        `,
      [teamId, companyId],
    );

    const tickets = Number(ticketsResult.rows[0].total);

    if (tickets > 0) {
      throw new Error("TEAM_HAS_TICKETS");
    }

    await client.query(
      `
        DELETE FROM team_members
        WHERE team_id = $1;
      `,
      [teamId],
    );

    const result = await client.query<{
      id: string;
      name: string;
    }>(
      `
          DELETE FROM teams

          WHERE id = $1
            AND company_id = $2

          RETURNING
            id,
            name;
        `,
      [teamId, companyId],
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
}
