import { Router } from "express";

import {
  listCustomersController,
  getCustomerByIdController,
  createCustomerController,
  updateCustomerController,
  deactivateCustomerController,
} from "../controllers/customer.controller";

import { authenticate } from "../middlewares/authenticate";

import { authorize } from "../middlewares/authorize";

export const customerRoutes = Router();

customerRoutes.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  listCustomersController,
);

customerRoutes.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  getCustomerByIdController,
);

customerRoutes.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  createCustomerController
);

customerRoutes.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateCustomerController
);

customerRoutes.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deactivateCustomerController
);