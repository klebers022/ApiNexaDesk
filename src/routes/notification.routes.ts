import { Router } from "express";

import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  unreadCountController,
} from "../controllers/notification.controller";

import {
  authenticate,
} from "../middlewares/authenticate";

export const notificationRoutes =
  Router();

notificationRoutes.get(
  "/",
  authenticate,
  listNotificationsController
);

notificationRoutes.get(
  "/unread-count",
  authenticate,
  unreadCountController
);

notificationRoutes.patch(
  "/read-all",
  authenticate,
  markAllNotificationsReadController
);

notificationRoutes.patch(
  "/:id/read",
  authenticate,
  markNotificationReadController
);