import {
  Request,
  Response,
} from "express";

import {
  listUsersQuerySchema,
  userIdParamSchema,
  createUserSchema,
} from "../schemas/user.schema";

import {
  createUser,
  listUsers,
  getUserById,
} from "../services/user.service";



export async function listUsersController(
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
    listUsersQuerySchema.safeParse(
      request.query
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Parâmetros de consulta inválidos.",

        details:
          validation.error
            .flatten()
            .fieldErrors,
      },
    });
  }

  try {
    const result = await listUsers({
      companyId:
        request.user.companyId,

      ...validation.data,
    });

    return response.status(200).json({
      data: result.users,

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

export async function getUserByIdController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const validation = userIdParamSchema.safeParse(
    request.params
  );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ID do usuário inválido.",
        details:
          validation.error.flatten().fieldErrors,
      },
    });
  }

  try {
    const user = await getUserById({
      userId: validation.data.id,
      companyId: request.user.companyId,
    });

    if (!user) {
      return response.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "Usuário não encontrado.",
        },
      });
    }

    return response.status(200).json({
      data: user,
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro interno do servidor.",
      },
    });
  }
}

export async function createUserController(
  request: Request,
  response: Response
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }
  

const validation = createUserSchema.safeParse(
  request.body
);

  

if (!validation.success) {
  console.log(
    "ERROS ZOD:",
    validation.error.issues
  );

  return response.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Dados do usuário inválidos.",
      details: validation.error.issues,
    },
  });
}

  try {
    const user = await createUser({
      companyId:
        request.user.companyId,

      ...validation.data,
    });

    return response.status(201).json({
      data: user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "EMAIL_ALREADY_EXISTS"
    ) {
      return response.status(409).json({
        error: {
          code:
            "EMAIL_ALREADY_EXISTS",
          message:
            "Já existe um usuário com este e-mail.",
        },
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "CUSTOMER_NOT_FOUND"
    ) {
      return response.status(404).json({
        error: {
          code:
            "CUSTOMER_NOT_FOUND",
          message:
            "Cliente não encontrado.",
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