import {
  Request,
  Response,
} from "express";

import {
  listCustomersQuerySchema,
  customerIdParamSchema,
   createCustomerSchema,
    updateCustomerSchema,
} from "../schemas/customer.schema";

import {
  getCustomerById,
  listCustomers,
  createCustomer,
  updateCustomer,
} from "../services/customer.service";

export async function listCustomersController(
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
    listCustomersQuerySchema.safeParse(
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
      await listCustomers({
        companyId:
          request.user.companyId,

        ...validation.data,
      });

    return response.status(200).json({
      data: result.customers,
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

export async function getCustomerByIdController(
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

  const validation =
    customerIdParamSchema.safeParse(
      request.params
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ID do cliente inválido.",
        details: validation.error.issues,
      },
    });
  }

  try {
    const customer =
      await getCustomerById({
        customerId:
          validation.data.id,

        companyId:
          request.user.companyId,
      });

    if (!customer) {
      return response.status(404).json({
        error: {
          code: "CUSTOMER_NOT_FOUND",
          message: "Cliente não encontrado.",
        },
      });
    }

    return response.status(200).json({
      data: customer,
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

export async function createCustomerController(
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

  const validation =
    createCustomerSchema.safeParse(
      request.body
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Dados do cliente inválidos.",
        details:
          validation.error.issues,
      },
    });
  }

  try {
    const customer =
      await createCustomer({
        companyId:
          request.user.companyId,

        ...validation.data,
      });

    return response.status(201).json({
      data: customer,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "CUSTOMER_DOCUMENT_ALREADY_EXISTS"
    ) {
      return response.status(409).json({
        error: {
          code:
            "CUSTOMER_DOCUMENT_ALREADY_EXISTS",

          message:
            "Já existe um cliente com este documento.",
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

export async function updateCustomerController(
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
    customerIdParamSchema.safeParse(
      request.params
    );

  if (!paramsValidation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "ID do cliente inválido.",
        details:
          paramsValidation.error.issues,
      },
    });
  }

  const bodyValidation =
    updateCustomerSchema.safeParse(
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
    const customer =
      await updateCustomer({
        customerId:
          paramsValidation.data.id,

        companyId:
          request.user.companyId,

        ...bodyValidation.data,
      });

    return response.status(200).json({
      data: customer,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "CUSTOMER_NOT_FOUND"
    ) {
      return response.status(404).json({
        error: {
          code: "CUSTOMER_NOT_FOUND",
          message:
            "Cliente não encontrado.",
        },
      });
    }

    if (
      error instanceof Error &&
      error.message ===
        "CUSTOMER_DOCUMENT_ALREADY_EXISTS"
    ) {
      return response.status(409).json({
        error: {
          code:
            "CUSTOMER_DOCUMENT_ALREADY_EXISTS",

          message:
            "Já existe um cliente com este documento.",
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