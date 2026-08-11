import { Request, Response } from "express";

import {
  assignTicketSchema,
  changeTicketStatusSchema,
  createTicketCommentSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdParamSchema,
  updateTicketSchema,
} from "../schemas/ticket.schema";

import {
  assignTicket,
  changeTicketStatus,
  createTicket,
  createTicketComment,
  getTicketById,
  listTicketComments,
  listTicketHistory,
  listTickets,
  updateTicket,
} from "../services/ticket.service";

export async function listTicketsController(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",

        message: "Usuário não autenticado.",
      },
    });
  }

  const validation = listTicketsQuerySchema.safeParse(request.query);

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message: "Parâmetros inválidos.",

        details: validation.error.issues,
      },
    });
  }

  try {
    const result = await listTickets({
      companyId: request.user.companyId,

      userId: request.user.id,

      role: request.user.role,

      ...validation.data,
    });

    return response.status(200).json({
      data: result.tickets,

      pagination: result.pagination,
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

export async function getTicketByIdController(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",

        message: "Usuário não autenticado.",
      },
    });
  }

  const validation = ticketIdParamSchema.safeParse(request.params);

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message: "ID do ticket inválido.",
      },
    });
  }

  try {
    const ticket = await getTicketById({
      ticketId: validation.data.id,

      companyId: request.user.companyId,

      userId: request.user.id,

      role: request.user.role,
    });

    if (!ticket) {
      return response.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",

          message: "Ticket não encontrado.",
        },
      });
    }

    return response.status(200).json({
      data: ticket,
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

export async function createTicketController(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",

        message: "Usuário não autenticado.",
      },
    });
  }

  const validation = createTicketSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message: "Dados do ticket inválidos.",

        details: validation.error.issues,
      },
    });
  }

  try {
    const ticket = await createTicket({
      companyId: request.user.companyId,

      authenticatedUserId: request.user.id,

      authenticatedUserRole: request.user.role,

      ...validation.data,
    });

    return response.status(201).json({
      data: ticket,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      return response.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",

          message: "Erro interno do servidor.",
        },
      });
    }

    const errors: Record<
      string,
      {
        status: number;
        message: string;
      }
    > = {
      REQUESTER_REQUIRED: {
        status: 400,
        message: "Informe o solicitante do ticket.",
      },

      REQUESTER_NOT_FOUND: {
        status: 404,
        message: "Solicitante não encontrado.",
      },

      CATEGORY_NOT_FOUND: {
        status: 404,
        message: "Categoria não encontrada.",
      },

      TEAM_NOT_FOUND: {
        status: 404,
        message: "Equipe não encontrada.",
      },

      ASSIGNEE_NOT_FOUND: {
        status: 404,
        message: "Responsável não encontrado.",
      },

      ASSIGNEE_NOT_IN_TEAM: {
        status: 400,
        message: "O responsável informado não pertence à equipe selecionada.",
      },
    };

    const mapped = errors[error.message];

    if (mapped) {
      return response.status(mapped.status).json({
        error: {
          code: error.message,

          message: mapped.message,
        },
      });
    }

    console.error(error);

    return response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",

        message: "Erro interno do servidor.",
      },
    });
  }
}

function handleTicketError(error: unknown, response: Response) {
  if (!(error instanceof Error)) {
    return response.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",

        message: "Erro interno do servidor.",
      },
    });
  }

  const errors: Record<
    string,
    {
      status: number;
      message: string;
    }
  > = {
    TICKET_NOT_FOUND: {
      status: 404,
      message: "Ticket não encontrado.",
    },

    CATEGORY_NOT_FOUND: {
      status: 404,
      message: "Categoria não encontrada.",
    },

    INTERNAL_COMMENT_FORBIDDEN: {
      status: 403,
      message: "Solicitantes não podem criar notas internas.",
    },

    TEAM_NOT_FOUND: {
      status: 404,
      message: "Equipe não encontrada.",
    },

    ASSIGNEE_NOT_FOUND: {
      status: 404,
      message: "Responsável não encontrado.",
    },

    ASSIGNEE_NOT_IN_TEAM: {
      status: 400,
      message: "O responsável não pertence à equipe selecionada.",
    },

    INVALID_STATUS_TRANSITION: {
      status: 409,
      message: "Transição de status não permitida.",
    },
  };

  const mapped = errors[error.message];

  if (mapped) {
    return response.status(mapped.status).json({
      error: {
        code: error.message,

        message: mapped.message,
      },
    });
  }

  console.error(error);

  return response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",

      message: "Erro interno do servidor.",
    },
  });
}

export async function updateTicketController(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const params = ticketIdParamSchema.safeParse(request.params);

  const body = updateTicketSchema.safeParse(request.body);

  if (!params.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ID inválido.",
      },
    });
  }

  if (!body.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: body.error.issues,
      },
    });
  }

  try {
    const ticket = await updateTicket({
      ticketId: params.data.id,

      companyId: request.user.companyId,

      authenticatedUserId: request.user.id,

      authenticatedUserRole: request.user.role,

      ...body.data,
    });

    return response.status(200).json({
      data: ticket,
    });
  } catch (error) {
    return handleTicketError(error, response);
  }
}

export async function assignTicketController(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const params = ticketIdParamSchema.safeParse(request.params);

  const body = assignTicketSchema.safeParse(request.body);

  if (!params.success || !body.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados de atribuição inválidos.",
      },
    });
  }

  try {
    const ticket = await assignTicket({
      ticketId: params.data.id,

      companyId: request.user.companyId,

      authenticatedUserId: request.user.id,

      authenticatedUserRole: request.user.role,

      ...body.data,
    });

    return response.status(200).json({
      data: ticket,
    });
  } catch (error) {
    return handleTicketError(error, response);
  }
}

export async function changeTicketStatusController(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const params = ticketIdParamSchema.safeParse(request.params);

  const body = changeTicketStatusSchema.safeParse(request.body);

  if (!params.success || !body.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Status inválido.",
      },
    });
  }

  try {
    const ticket = await changeTicketStatus({
      ticketId: params.data.id,

      companyId: request.user.companyId,

      authenticatedUserId: request.user.id,

      authenticatedUserRole: request.user.role,

      status: body.data.status,
    });

    return response.status(200).json({
      data: ticket,
    });
  } catch (error) {
    return handleTicketError(error, response);
  }
}

async function executeStatusAction(
  request: Request,
  response: Response,
  status: "RESOLVED" | "CLOSED" | "IN_PROGRESS",
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const params = ticketIdParamSchema.safeParse(request.params);

  if (!params.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ID do ticket inválido.",
      },
    });
  }

  try {
    const ticket = await changeTicketStatus({
      ticketId: params.data.id,

      companyId: request.user.companyId,

      authenticatedUserId: request.user.id,

      authenticatedUserRole: request.user.role,

      status,
    });

    return response.status(200).json({
      data: ticket,
    });
  } catch (error) {
    return handleTicketError(error, response);
  }
}

export function resolveTicketController(request: Request, response: Response) {
  return executeStatusAction(request, response, "RESOLVED");
}

export function closeTicketController(request: Request, response: Response) {
  return executeStatusAction(request, response, "CLOSED");
}

export function reopenTicketController(request: Request, response: Response) {
  return executeStatusAction(request, response, "IN_PROGRESS");
}

export async function listTicketCommentsController(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const validation = ticketIdParamSchema.safeParse(request.params);

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ID do ticket inválido.",
        details: validation.error.issues,
      },
    });
  }

  try {
    const comments = await listTicketComments({
      ticketId: validation.data.id,

      companyId: request.user.companyId,

      authenticatedUserId: request.user.id,

      authenticatedUserRole: request.user.role,
    });

    return response.status(200).json({
      data: comments,
    });
  } catch (error) {
    return handleTicketError(error, response);
  }
}

export async function createTicketCommentController(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const paramsValidation = ticketIdParamSchema.safeParse(request.params);

  if (!paramsValidation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ID do ticket inválido.",
      },
    });
  }

  const bodyValidation = createTicketCommentSchema.safeParse(request.body);

  if (!bodyValidation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",

        message: "Comentário inválido.",

        details: bodyValidation.error.issues,
      },
    });
  }

  try {
    const comment = await createTicketComment({
      ticketId: paramsValidation.data.id,

      companyId: request.user.companyId,

      authenticatedUserId: request.user.id,

      authenticatedUserRole: request.user.role,

      ...bodyValidation.data,
    });

    return response.status(201).json({
      data: comment,
    });
  } catch (error) {
    return handleTicketError(error, response);
  }
}

export async function listTicketHistoryController(
  request: Request,
  response: Response,
) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const validation = ticketIdParamSchema.safeParse(request.params);

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ID do ticket inválido.",
      },
    });
  }

  try {
    const history = await listTicketHistory({
      ticketId: validation.data.id,

      companyId: request.user.companyId,

      authenticatedUserId: request.user.id,

      authenticatedUserRole: request.user.role,
    });

    return response.status(200).json({
      data: history,
    });
  } catch (error) {
    return handleTicketError(error, response);
  }
}
