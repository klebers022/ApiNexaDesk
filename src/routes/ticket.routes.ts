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
  authorize("ADMIN", "AGENT", "REQUESTER"),
  listTicketsController,
);

ticketRoutes.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "AGENT", "REQUESTER"),
  getTicketByIdController,
);

ticketRoutes.post(
  "/",
  authenticate,
  authorize("ADMIN", "AGENT", "REQUESTER"),
  createTicketController,
);

ticketRoutes.put(
  "/:id",
  authenticate,
  authorize("ADMIN", "AGENT"),
  updateTicketController,
);

ticketRoutes.post(
  "/:id/assign",
  authenticate,
  authorize("ADMIN", "AGENT"),
  assignTicketController,
);

ticketRoutes.post(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "AGENT"),
  changeTicketStatusController,
);

ticketRoutes.post(
  "/:id/resolve",
  authenticate,
  authorize("ADMIN", "AGENT"),
  resolveTicketController,
);

ticketRoutes.post(
  "/:id/close",
  authenticate,
  authorize("ADMIN", "AGENT"),
  closeTicketController,
);

ticketRoutes.post(
  "/:id/reopen",
  authenticate,
  authorize("ADMIN", "AGENT"),
  reopenTicketController,
);

ticketRoutes.get(
  "/:id/comments",
  authenticate,
  authorize(
    "ADMIN",
    "AGENT",
    "REQUESTER"
  ),
  listTicketCommentsController
);

ticketRoutes.post(
  "/:id/comments",
  authenticate,
  authorize(
    "ADMIN",
    "AGENT",
    "REQUESTER"
  ),
  createTicketCommentController
);

ticketRoutes.get(
  "/:id/history",
  authenticate,
  authorize(
    "ADMIN",
    "AGENT",
    "REQUESTER"
  ),
  listTicketHistoryController
);