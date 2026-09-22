import { Request, Response } from "express";
import { pool } from "../database/connection";
import {
  aiChatSchema,
  searchSolutionsSchema,
  triageTicketSchema,
} from "../schemas/ai.schema";
import {
  classifyTicket,
  generateSolutionResponse,
} from "../services/ai.service";
import { searchPublishedKnowledge } from "../services/knowledge.service";
import { createAiRequesterTicket, recordAiInteraction } from "../services/ai-interaction.service";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
}

// ======================================================
// TRIAGE CONTROLLER
// ======================================================

export async function triageController(request: Request, response: Response) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const validation = triageTicketSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Parâmetros inválidos para triagem de chamado.",
        details: validation.error.issues,
      },
    });
  }

  const { text } = validation.data;
  const companyId = request.user.companyId;

  try {
    const categoriesResult = await pool.query<CategoryRow>(
      `
        SELECT id, name, description
        FROM categories
        WHERE company_id = $1 AND status = 'ACTIVE'
        ORDER BY name ASC;
      `,
      [companyId]
    );

    const classification = await classifyTicket({
      text,
      categories: categoriesResult.rows,
    });

    return response.status(200).json({
      data: classification,
    });
  } catch (error) {
    console.error("[AI TRIAGE ERROR]", error);
    return response.status(500).json({
      error: {
        code: "AI_TRIAGE_ERROR",
        message: "Falha ao realizar a triagem do chamado.",
      },
    });
  }
}

// ======================================================
// SEARCH SOLUTIONS CONTROLLER
// ======================================================

export async function searchSolutionsController(
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

  const validation = searchSolutionsSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Parâmetros de busca de soluções inválidos.",
        details: validation.error.issues,
      },
    });
  }

  const { query, categoryId, limit } = validation.data;
  const companyId = request.user.companyId;

  try {
    const solutions = await searchPublishedKnowledge({
      companyId,
      query,
      categoryId,
      limit,
    });

    return response.status(200).json({
      data: {
        query,
        count: solutions.length,
        solutions,
      },
    });
  } catch (error) {
    console.error("[AI SEARCH ERROR]", error);
    return response.status(500).json({
      error: {
        code: "AI_SEARCH_ERROR",
        message: "Falha ao buscar soluções históricas.",
      },
    });
  }
}

// ======================================================
// CHAT INTERACTIVE ORCHESTRATOR
// ======================================================

export async function chatController(request: Request, response: Response) {
  if (!request.user) {
    return response.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Usuário não autenticado.",
      },
    });
  }

  const validation = aiChatSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Mensagem do chat inválida.",
        details: validation.error.issues,
      },
    });
  }

  const { message, categoryId: requestedCategoryId, action } = validation.data;
  const companyId = request.user.companyId;
  const user = request.user;

  try {
    // 1. Ação: usuário confirmou resolução self-service (Ticket Deflection)
    if (action === "resolve") {
      await recordAiInteraction({
        companyId,
        userId: user.id,
        action: "RESOLVE",
        inputMessage: message,
        response: "Atendimento resolvido por autoatendimento.",
        resolved: true,
      });
      return response.status(200).json({
        data: {
          action: "resolve",
          deflected: true,
          response:
            "🎉 Que ótimo que o problema foi solucionado! Seu atendimento foi concluído com sucesso sem a necessidade de abertura de chamado. Agradecemos o contato com o NexaDesk!",
        },
      });
    }

    // Busca categorias ativas
    const categoriesResult = await pool.query<CategoryRow>(
      `
        SELECT id, name, description
        FROM categories
        WHERE company_id = $1 AND status = 'ACTIVE'
        ORDER BY name ASC;
      `,
      [companyId]
    );

    const categories = categoriesResult.rows;

    // Realiza a classificação do problema
    const classification = await classifyTicket({
      text: message,
      categories,
    });

    const categoryIdToUse = requestedCategoryId || classification.categoryId;

    // Busca soluções similares na base histórica
    const solutions = await searchPublishedKnowledge({
      companyId,
      query: message,
      categoryId: categoryIdToUse || undefined,
      limit: 3,
    });

    // 2. Ação: usuário solicitou abertura direta de chamado
    if (action === "create_ticket") {
      if (user.role !== "REQUESTER") {
        return response.status(403).json({
          error: {
            code: "AI_TICKET_CREATION_REQUESTER_ONLY",
            message: "A abertura de chamado pela IA está disponível somente para solicitantes.",
          },
        });
      }
      if (!categoryIdToUse) {
        return response.status(400).json({
          error: {
            code: "CATEGORY_REQUIRED",
            message: "Não foi possível determinar a categoria do chamado.",
          },
        });
      }

      // Criação automática do ticket
      const newTicket = await createAiRequesterTicket({
        companyId,
        userId: user.id,
        userRole: user.role,
        title: classification.suggestedTitle,
        description: message,
        priority: classification.priority,
        categoryId: categoryIdToUse,
        classification,
        solutions,
        response: "Chamado criado a partir do assistente de IA.",
      });

      // Gera o diagnóstico técnico estruturado e salva como comentário interno
      return response.status(201).json({
        data: {
          action: "create_ticket",
          ticket: newTicket,
          classification,
          response: `✅ Seu chamado **#${newTicket.ticketNumber}** foi registrado com sucesso na categoria **${classification.categoryName}** com prioridade **${classification.priority}**! Nossa equipe técnica já foi notificada com o diagnóstico prévio e em breve entrará em contato.`,
        },
      });
    }

    // 3. Ação padrão ('message'): Análise e apresentação de soluções
    const solutionText = await generateSolutionResponse({
      userMessage: message,
      matchingSolutions: solutions,
    });

    await recordAiInteraction({
      companyId,
      userId: user.id,
      action: "MESSAGE",
      inputMessage: message,
      response: solutionText,
      classification,
      solutions,
    });

    return response.status(200).json({
      data: {
        action: "message",
        classification,
        solutions,
        response: solutionText,
        canCreateTicket: user.role === "REQUESTER",
      },
    });
  } catch (error) {
    console.error("[AI CHAT ERROR]", error);
    return response.status(500).json({
      error: {
        code: "AI_CHAT_ERROR",
        message: "Erro ao processar a interação do chatbot.",
      },
    });
  }
}
