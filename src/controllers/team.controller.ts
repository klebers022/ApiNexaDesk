import {
  Request,
  Response,
} from "express";

import {
  addTeamMemberSchema,
  createTeamSchema,
  listTeamsQuerySchema,
  teamIdParamSchema,
  teamMemberParamSchema,
  updateTeamSchema,
} from "../schemas/team.schema";

import {
  addTeamMember,
  createTeam,
  deleteTeam,
  getTeamById,
  listTeamMembers,
  listTeams,
  removeTeamMember,
  updateTeam,
} from "../services/team.service";

function handleTeamError(
  error: unknown,
  response: Response
) {
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
    TEAM_NOT_FOUND: {
      status: 404,
      message: "Equipe não encontrada.",
    },

    USER_NOT_FOUND: {
      status: 404,
      message: "Usuário não encontrado.",
    },

    TEAM_NAME_ALREADY_EXISTS: {
      status: 409,
      message:
        "Já existe uma equipe com este nome.",
    },

    TEAM_MEMBER_ALREADY_EXISTS: {
      status: 409,
      message:
        "O usuário já pertence a esta equipe.",
    },

    TEAM_MEMBER_NOT_FOUND: {
      status: 404,
      message:
        "Membro da equipe não encontrado.",
    },

    USER_MUST_BE_AGENT: {
      status: 400,
      message:
        "Somente usuários AGENT podem ser adicionados à equipe.",
    },

    USER_INACTIVE: {
      status: 400,
      message:
        "Usuários inativos não podem ser adicionados à equipe.",
    },

    TEAM_HAS_TICKETS: {
      status: 409,
      message:
        "A equipe possui tickets vinculados e não pode ser excluída.",
    },
  };

  const mapped =
    errors[error.message];

  if (mapped) {
    return response
      .status(mapped.status)
      .json({
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

// ======================================================
// LIST
// ======================================================

export async function listTeamsController(
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
    listTeamsQuerySchema.safeParse(
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
    const result = await listTeams({
      companyId:
        request.user.companyId,

      ...validation.data,
    });

    return response.status(200).json({
      data: result.teams,
      pagination:
        result.pagination,
    });
  } catch (error) {
    return handleTeamError(
      error,
      response
    );
  }
}

// ======================================================
// GET
// ======================================================

export async function getTeamByIdController(
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
    teamIdParamSchema.safeParse(
      request.params
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "ID da equipe inválido.",
        details:
          validation.error.issues,
      },
    });
  }

  try {
    const team =
      await getTeamById({
        teamId:
          validation.data.id,

        companyId:
          request.user.companyId,
      });

    if (!team) {
      return response.status(404).json({
        error: {
          code: "TEAM_NOT_FOUND",
          message:
            "Equipe não encontrada.",
        },
      });
    }

    return response.status(200).json({
      data: team,
    });
  } catch (error) {
    return handleTeamError(
      error,
      response
    );
  }
}

// ======================================================
// CREATE
// ======================================================

export async function createTeamController(
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
    createTeamSchema.safeParse(
      request.body
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Dados da equipe inválidos.",
        details:
          validation.error.issues,
      },
    });
  }

  try {
    const team =
      await createTeam({
        companyId:
          request.user.companyId,

        ...validation.data,
      });

    return response
      .status(201)
      .json({
        data: team,
      });
  } catch (error) {
    return handleTeamError(
      error,
      response
    );
  }
}

// ======================================================
// UPDATE
// ======================================================

export async function updateTeamController(
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

  const params =
    teamIdParamSchema.safeParse(
      request.params
    );

  const body =
    updateTeamSchema.safeParse(
      request.body
    );

  if (!params.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ID da equipe inválido.",
        details: params.error.issues,
      },
    });
  }

  if (!body.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Dados da equipe inválidos.",
        details: body.error.issues,
      },
    });
  }

  try {
    const team =
      await updateTeam({
        teamId:
          params.data.id,

        companyId:
          request.user.companyId,

        ...body.data,
      });

    return response.status(200).json({
      data: team,
    });
  } catch (error) {
    return handleTeamError(
      error,
      response
    );
  }
}

// ======================================================
// MEMBERS
// ======================================================

export async function listTeamMembersController(
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
    teamIdParamSchema.safeParse(
      request.params
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ID da equipe inválido.",
      },
    });
  }

  try {
    const members =
      await listTeamMembers({
        teamId:
          validation.data.id,

        companyId:
          request.user.companyId,
      });

    return response.status(200).json({
      data: members,
    });
  } catch (error) {
    return handleTeamError(
      error,
      response
    );
  }
}

export async function addTeamMemberController(
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

  const params =
    teamIdParamSchema.safeParse(
      request.params
    );

  const body =
    addTeamMemberSchema.safeParse(
      request.body
    );

  if (!params.success || !body.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Dados inválidos.",
      },
    });
  }

  try {
    const member =
      await addTeamMember({
        teamId:
          params.data.id,

        userId:
          body.data.userId,

        companyId:
          request.user.companyId,
      });

    return response
      .status(201)
      .json({
        data: member,
      });
  } catch (error) {
    return handleTeamError(
      error,
      response
    );
  }
}

export async function removeTeamMemberController(
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
    teamMemberParamSchema.safeParse(
      request.params
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "Parâmetros inválidos.",
      },
    });
  }

  try {
    const result =
      await removeTeamMember({
        teamId:
          validation.data.id,

        userId:
          validation.data.userId,

        companyId:
          request.user.companyId,
      });

    return response.status(200).json({
      data: result,
    });
  } catch (error) {
    return handleTeamError(
      error,
      response
    );
  }
}

// ======================================================
// DELETE
// ======================================================

export async function deleteTeamController(
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
    teamIdParamSchema.safeParse(
      request.params
    );

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "ID da equipe inválido.",
      },
    });
  }

  try {
    const team =
      await deleteTeam({
        teamId:
          validation.data.id,

        companyId:
          request.user.companyId,
      });

    return response.status(200).json({
      data: team,
    });
  } catch (error) {
    return handleTeamError(
      error,
      response
    );
  }
}