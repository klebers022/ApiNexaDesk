import { Router } from "express";

import {
  listCustomersController,
} from "../controllers/customer.controller";

import {
  authenticate,
} from "../middlewares/authenticate";

import {
  authorize,
} from "../middlewares/authorize";

export const customerRoutes =
  Router();

customerRoutes.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  listCustomersController
);