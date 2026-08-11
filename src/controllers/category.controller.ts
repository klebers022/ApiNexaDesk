import {
  Request,
  Response,
} from "express";

import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "../schemas/category.schema";

import {
  createCategory,
  deactivateCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "../services/category.service";

// ======================================================
// LIST
// ======================================================

export async function listCategoriesController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message:
          "Usuário não autenticado.",
      },
    });
  }

  const validation =
    listCategoriesQuerySchema.safeParse(
      request.query
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message:
          "Parâmetros de consulta inválidos.",

        details:
          validation.error.issues,
      },
    });
  }

  try {
    const result =
      await listCategories({
        companyId:
          request.user.companyId,

        ...validation.data,
      });

    return response.status(200).json({
      data:
        result.categories,

      pagination:
        result.pagination,
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Erro interno do servidor.",
      },
    });
  }
}

// ======================================================
// GET BY ID
// ======================================================

export async function getCategoryByIdController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message:
          "Usuário não autenticado.",
      },
    });
  }

  const validation =
    categoryIdParamSchema.safeParse(
      request.params
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message:
          "ID da categoria inválido.",

        details:
          validation.error.issues,
      },
    });
  }

  try {
    const category =
      await getCategoryById({
        categoryId:
          validation.data.id,

        companyId:
          request.user.companyId,
      });

    if (!category) {
      return response.status(404).json({
        error: {
          code:
            "CATEGORY_NOT_FOUND",

          message:
            "Categoria não encontrada.",
        },
      });
    }

    return response.status(200).json({
      data: category,
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Erro interno do servidor.",
      },
    });
  }
}

// ======================================================
// CREATE
// ======================================================

export async function createCategoryController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message:
          "Usuário não autenticado.",
      },
    });
  }

  const validation =
    createCategorySchema.safeParse(
      request.body
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message:
          "Dados da categoria inválidos.",

        details:
          validation.error.issues,
      },
    });
  }

  try {
    const category =
      await createCategory({
        companyId:
          request.user.companyId,

        ...validation.data,
      });

    return response.status(201).json({
      data: category,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_NAME_ALREADY_EXISTS"
    ) {
      return response.status(409).json({
        error: {
          code:
            "CATEGORY_NAME_ALREADY_EXISTS",

          message:
            "Já existe uma categoria com este nome.",
        },
      });
    }

    console.error(error);

    return response.status(500).json({
      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Erro interno do servidor.",
      },
    });
  }
}

// ======================================================
// UPDATE
// ======================================================

export async function updateCategoryController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message:
          "Usuário não autenticado.",
      },
    });
  }

  const paramsValidation =
    categoryIdParamSchema.safeParse(
      request.params
    );

  if (!paramsValidation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message:
          "ID da categoria inválido.",

        details:
          paramsValidation.error.issues,
      },
    });
  }

  const bodyValidation =
    updateCategorySchema.safeParse(
      request.body
    );

  if (!bodyValidation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message:
          "Dados de atualização inválidos.",

        details:
          bodyValidation.error.issues,
      },
    });
  }

  try {
    const category =
      await updateCategory({
        categoryId:
          paramsValidation.data.id,

        companyId:
          request.user.companyId,

        ...bodyValidation.data,
      });

    return response.status(200).json({
      data: category,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_NOT_FOUND"
    ) {
      return response.status(404).json({
        error: {
          code:
            "CATEGORY_NOT_FOUND",

          message:
            "Categoria não encontrada.",
        },
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_NAME_ALREADY_EXISTS"
    ) {
      return response.status(409).json({
        error: {
          code:
            "CATEGORY_NAME_ALREADY_EXISTS",

          message:
            "Já existe uma categoria com este nome.",
        },
      });
    }

    console.error(error);

    return response.status(500).json({
      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Erro interno do servidor.",
      },
    });
  }
}

// ======================================================
// DELETE / SOFT DELETE
// ======================================================

export async function deactivateCategoryController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",

        message:
          "Usuário não autenticado.",
      },
    });
  }

  const validation =
    categoryIdParamSchema.safeParse(
      request.params
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message:
          "ID da categoria inválido.",

        details:
          validation.error.issues,
      },
    });
  }

  try {
    const category =
      await deactivateCategory({
        categoryId:
          validation.data.id,

        companyId:
          request.user.companyId,
      });

    return response.status(200).json({
      data: category,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "CATEGORY_NOT_FOUND"
    ) {
      return response.status(404).json({
        error: {
          code:
            "CATEGORY_NOT_FOUND",

          message:
            "Categoria não encontrada.",
        },
      });
    }

    console.error(error);

    return response.status(500).json({
      error: {
        code:
          "INTERNAL_SERVER_ERROR",

        message:
          "Erro interno do servidor.",
      },
    });
  }
}