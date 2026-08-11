import {
  rateLimit,
} from "express-rate-limit";

// ======================================================
// GLOBAL API LIMIT
// ======================================================

export const apiRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      500,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      error: {
        code:
          "RATE_LIMIT_EXCEEDED",

        message:
          "Muitas requisições. Tente novamente mais tarde.",
      },
    },
  });

// ======================================================
// LOGIN LIMIT
// ======================================================

export const authRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      30,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      error: {
        code:
          "AUTH_RATE_LIMIT_EXCEEDED",

        message:
          "Muitas tentativas de autenticação. Tente novamente mais tarde.",
      },
    },
  });