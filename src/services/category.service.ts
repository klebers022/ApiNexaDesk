import { pool } from "../database/connection";

import {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "../schemas/category.schema";

interface DatabaseCategory {
  id: string;
  company_id: string;

  name: string;
  description: string | null;

  status: "ACTIVE" | "INACTIVE";

  created_at: Date;
  updated_at: Date;
}

interface CountResult {
  total: string;
}

// ======================================================
// LIST
// ======================================================

interface ListCategoriesParams
  extends ListCategoriesQuery {
  companyId: string;
}

export async function listCategories({
  companyId,
  page,
  pageSize,
  search,
  status,
}: ListCategoriesParams) {
  const conditions: string[] = [
    "c.company_id = $1",
  ];

  const values: unknown[] = [
    companyId,
  ];

  if (status) {
    values.push(status);

    conditions.push(
      `c.status = $${values.length}`
    );
  }

  if (search) {
    values.push(`%${search}%`);

    const position = values.length;

    conditions.push(`
      (
        c.name ILIKE $${position}
        OR c.description ILIKE $${position}
      )
    `);
  }

  const whereClause =
    conditions.join(" AND ");

  const countResult =
    await pool.query<CountResult>(
      `
        SELECT COUNT(*) AS total

        FROM categories c

        WHERE ${whereClause};
      `,
      values
    );

  const total =
    Number(countResult.rows[0].total);

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

  const result =
    await pool.query<DatabaseCategory>(
      `
        SELECT
          c.id,
          c.company_id,
          c.name,
          c.description,
          c.status,
          c.created_at,
          c.updated_at

        FROM categories c

        WHERE ${whereClause}

        ORDER BY c.name ASC

        LIMIT $${limitPosition}
        OFFSET $${offsetPosition};
      `,
      dataValues
    );

  const categories =
    result.rows.map((category) => ({
      id: category.id,

      companyId:
        category.company_id,

      name:
        category.name,

      description:
        category.description,

      status:
        category.status,

      createdAt:
        category.created_at,

      updatedAt:
        category.updated_at,
    }));

  return {
    categories,

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
// GET BY ID
// ======================================================

interface GetCategoryByIdParams {
  categoryId: string;
  companyId: string;
}

export async function getCategoryById({
  categoryId,
  companyId,
}: GetCategoryByIdParams) {
  const result =
    await pool.query<DatabaseCategory>(
      `
        SELECT
          id,
          company_id,
          name,
          description,
          status,
          created_at,
          updated_at

        FROM categories

        WHERE id = $1
          AND company_id = $2

        LIMIT 1;
      `,
      [
        categoryId,
        companyId,
      ]
    );

  const category =
    result.rows[0];

  if (!category) {
    return null;
  }

  return {
    id:
      category.id,

    companyId:
      category.company_id,

    name:
      category.name,

    description:
      category.description,

    status:
      category.status,

    createdAt:
      category.created_at,

    updatedAt:
      category.updated_at,
  };
}

// ======================================================
// CREATE
// ======================================================

interface CreateCategoryParams
  extends CreateCategoryInput {
  companyId: string;
}

export async function createCategory({
  companyId,
  name,
  description,
}: CreateCategoryParams) {
  const existingCategory =
    await pool.query<{ id: string }>(
      `
        SELECT id

        FROM categories

        WHERE company_id = $1
          AND LOWER(name) = LOWER($2)

        LIMIT 1;
      `,
      [
        companyId,
        name,
      ]
    );

  if (existingCategory.rows[0]) {
    throw new Error(
      "CATEGORY_NAME_ALREADY_EXISTS"
    );
  }

  const result =
    await pool.query<DatabaseCategory>(
      `
        INSERT INTO categories (
          company_id,
          name,
          description,
          status
        )

        VALUES (
          $1,
          $2,
          $3,
          'ACTIVE'
        )

        RETURNING
          id,
          company_id,
          name,
          description,
          status,
          created_at,
          updated_at;
      `,
      [
        companyId,
        name,
        description ?? null,
      ]
    );

  const category =
    result.rows[0];

  return {
    id:
      category.id,

    companyId:
      category.company_id,

    name:
      category.name,

    description:
      category.description,

    status:
      category.status,

    createdAt:
      category.created_at,

    updatedAt:
      category.updated_at,
  };
}

// ======================================================
// UPDATE
// ======================================================

interface UpdateCategoryParams
  extends UpdateCategoryInput {
  categoryId: string;
  companyId: string;
}

export async function updateCategory({
  categoryId,
  companyId,
  name,
  description,
  status,
}: UpdateCategoryParams) {
  const currentResult =
    await pool.query<DatabaseCategory>(
      `
        SELECT
          id,
          company_id,
          name,
          description,
          status,
          created_at,
          updated_at

        FROM categories

        WHERE id = $1
          AND company_id = $2

        LIMIT 1;
      `,
      [
        categoryId,
        companyId,
      ]
    );

  const currentCategory =
    currentResult.rows[0];

  if (!currentCategory) {
    throw new Error(
      "CATEGORY_NOT_FOUND"
    );
  }

  if (name !== undefined) {
    const duplicateResult =
      await pool.query<{ id: string }>(
        `
          SELECT id

          FROM categories

          WHERE company_id = $1
            AND LOWER(name) = LOWER($2)
            AND id <> $3

          LIMIT 1;
        `,
        [
          companyId,
          name,
          categoryId,
        ]
      );

    if (duplicateResult.rows[0]) {
      throw new Error(
        "CATEGORY_NAME_ALREADY_EXISTS"
      );
    }
  }

  const result =
    await pool.query<DatabaseCategory>(
      `
        UPDATE categories

        SET
          name = COALESCE($1, name),
          description = $2,
          status = COALESCE($3, status)

        WHERE id = $4
          AND company_id = $5

        RETURNING
          id,
          company_id,
          name,
          description,
          status,
          created_at,
          updated_at;
      `,
      [
        // $1
        name ?? null,

        // $2
        description !== undefined
          ? description
          : currentCategory.description,

        // $3
        status ?? null,

        // $4
        categoryId,

        // $5
        companyId,
      ]
    );

  const category =
    result.rows[0];

  return {
    id:
      category.id,

    companyId:
      category.company_id,

    name:
      category.name,

    description:
      category.description,

    status:
      category.status,

    createdAt:
      category.created_at,

    updatedAt:
      category.updated_at,
  };
}

// ======================================================
// DEACTIVATE
// ======================================================

interface DeactivateCategoryParams {
  categoryId: string;
  companyId: string;
}

export async function deactivateCategory({
  categoryId,
  companyId,
}: DeactivateCategoryParams) {
  const result =
    await pool.query<DatabaseCategory>(
      `
        UPDATE categories

        SET status = 'INACTIVE'

        WHERE id = $1
          AND company_id = $2

        RETURNING
          id,
          company_id,
          name,
          description,
          status,
          created_at,
          updated_at;
      `,
      [
        categoryId,
        companyId,
      ]
    );

  const category =
    result.rows[0];

  if (!category) {
    throw new Error(
      "CATEGORY_NOT_FOUND"
    );
  }

  return {
    id:
      category.id,

    companyId:
      category.company_id,

    name:
      category.name,

    description:
      category.description,

    status:
      category.status,

    createdAt:
      category.created_at,

    updatedAt:
      category.updated_at,
  };
}