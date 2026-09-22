import { Router } from "express";

import {
  assignTicketController,
  changeTicketStatusController,
  closeTicketController,
  createTicketCommentController,
  createTicketController,
  getTicketByIdController,
  listTicketCommentsController,
  listTicketHistoryController,
  listTicketsController,
  reopenTicketController,
  resolveTicketController,
  updateTicketController,
} from "../controllers/ticket.controller";

import { authenticate } from "../middlewares/authenticate";

import { authorize } from "../middlewares/authorize";

export const ticketRoutes = Router();

ticketRoutes.get(
  "/",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST", "REQUESTER"),
  listTicketsController,
);

ticketRoutes.get(
  "/:id",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST", "REQUESTER"),
  getTicketByIdController,
);

ticketRoutes.post(
  "/",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST", "REQUESTER"),
  createTicketController,
);

ticketRoutes.put(
  "/:id",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST"),
  updateTicketController,
);

ticketRoutes.post(
  "/:id/assign",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST"),
  assignTicketController,
);

ticketRoutes.post(
  "/:id/status",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST"),
  changeTicketStatusController,
);

ticketRoutes.post(
  "/:id/resolve",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST"),
  resolveTicketController,
);

ticketRoutes.post(
  "/:id/close",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST"),
  closeTicketController,
);

ticketRoutes.post(
  "/:id/reopen",
  authenticate,
  authorize("COMPANY_ADMIN", "ANALYST"),
  reopenTicketController,
);

ticketRoutes.get(
  "/:id/comments",
  authenticate,
  authorize(
    "COMPANY_ADMIN",
    "ANALYST",
    "REQUESTER"
  ),
  listTicketCommentsController
);

ticketRoutes.post(
  "/:id/comments",
  authenticate,
  authorize(
    "COMPANY_ADMIN",
    "ANALYST",
    "REQUESTER"
  ),
  createTicketCommentController
);

ticketRoutes.get(
  "/:id/history",
  authenticate,
  authorize(
    "COMPANY_ADMIN",
    "ANALYST",
    "REQUESTER"
  ),
  listTicketHistoryController
);
