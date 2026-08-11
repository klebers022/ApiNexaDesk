import { Router } from "express";

import {
  createCategoryController,
  deactivateCategoryController,
  getCategoryByIdController,
  listCategoriesController,
  updateCategoryController,
} from "../controllers/category.controller";

import {
  authenticate,
} from "../middlewares/authenticate";

import {
  authorize,
} from "../middlewares/authorize";

export const categoryRoutes =
  Router();

// ======================================================
// GET ALL
// ======================================================

categoryRoutes.get(
  "/",
  authenticate,
  authorize(
    "ADMIN",
    "AGENT",
    "REQUESTER"
  ),
  listCategoriesController
);

// ======================================================
// GET BY ID
// ======================================================

categoryRoutes.get(
  "/:id",
  authenticate,
  authorize(
    "ADMIN",
    "AGENT",
    "REQUESTER"
  ),
  getCategoryByIdController
);

// ======================================================
// CREATE
// ======================================================

categoryRoutes.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createCategoryController
);

// ======================================================
// UPDATE
// ======================================================

categoryRoutes.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateCategoryController
);

// ======================================================
// DELETE / SOFT DELETE
// ======================================================

categoryRoutes.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deactivateCategoryController
);