import { PoolClient } from "pg";
import { pool } from "../database/connection";
import { UserRole } from "../types/auth";
import { TicketClassification } from "./ai.service";
import { HistoricalSolution } from "./knowledge.service";
import { createTicket } from "./ticket.service";

type AiAction = "MESSAGE" | "RESOLVE" | "CREATE_TICKET";

interface InteractionInput {
  companyId: string;
  userId: string;
  action: AiAction;
  inputMessage: string;
  response: string;
  classification?: TicketClassification;
  solutions?: HistoricalSolution[];
  ticketId?: string;
  resolved?: boolean;
}

async function insertInteraction(client: PoolClient, input: InteractionInput) {
  await client.query(
    `INSERT INTO ai_interactions (
      company_id, user_id, action, input_message, response,
      classification, matched_solutions, ticket_id, resolved_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
      CASE WHEN $9 THEN NOW() ELSE NULL END)`,
    [
      input.companyId, input.userId, input.action, input.inputMessage,
      input.response, input.classification ? JSON.stringify(input.classification) : null,
      input.solutions ? JSON.stringify(input.solutions) : null,
      input.ticketId ?? null, input.resolved ?? false,
    ],
  );
}

export async function recordAiInteraction(input: InteractionInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await insertInteraction(client, input);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createAiRequesterTicket(input: {
  companyId: string;
  userId: string;
  userRole: UserRole;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  categoryId: string;
  classification: TicketClassification;
  solutions: HistoricalSolution[];
  response: string;
}) {
  if (input.userRole !== "REQUESTER") {
    throw new Error("AI_TICKET_CREATION_REQUESTER_ONLY");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ticket = await createTicket({
      companyId: input.companyId,
      authenticatedUserId: input.userId,
      authenticatedUserRole: input.userRole,
      title: input.title,
      description: input.description,
      priority: input.priority,
      categoryId: input.categoryId,
      requesterId: input.userId,
      transactionClient: client,
    });
    await insertInteraction(client, {
      companyId: input.companyId,
      userId: input.userId,
      action: "CREATE_TICKET",
      inputMessage: input.description,
      response: input.response,
      classification: input.classification,
      solutions: input.solutions,
      ticketId: ticket.id,
    });
    await client.query("COMMIT");
    return ticket;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
