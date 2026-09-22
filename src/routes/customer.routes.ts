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
  authorize("COMPANY_ADMIN"),
  listCustomersController,
);

customerRoutes.get(
  "/:id",
  authenticate,
  authorize("COMPANY_ADMIN"),
  getCustomerByIdController,
);

customerRoutes.post(
  "/",
  authenticate,
  authorize("COMPANY_ADMIN"),
  createCustomerController
);

customerRoutes.put(
  "/:id",
  authenticate,
  authorize("COMPANY_ADMIN"),
  updateCustomerController
);

customerRoutes.delete(
  "/:id",
  authenticate,
  authorize("COMPANY_ADMIN"),
  deactivateCustomerController
);
