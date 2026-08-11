import {
  Router,
} from "express";

import {
  getDashboardController,
} from "../controllers/dashboard.controller";

import {
  authenticate,
} from "../middlewares/authenticate";

export const dashboardRoutes =
  Router();

// ======================================================
// DASHBOARD
// ======================================================

dashboardRoutes.get(
  "/",
  authenticate,
  getDashboardController
);