import "dotenv/config";
import { z } from "zod";

// ======================================================
// ENV SCHEMA
// ======================================================

const envSchema = z.object({
  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3000),

  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production",
    ])
    .default(
      "development"
    ),

  DATABASE_URL: z
    .string()
    .min(
      1,
      "DATABASE_URL é obrigatória"
    ),

  FRONTEND_URL: z
    .string()
    .min(
      1,
      "FRONTEND_URL é obrigatória"
    )
    .superRefine(
      (value, context) => {
        const urls =
          value
            .split(",")
            .map(
              (url) =>
                url.trim()
            )
            .filter(Boolean);

        if (
          urls.length === 0
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            message:
              "Informe pelo menos uma FRONTEND_URL válida.",
          });

          return;
        }

        for (
          const url
          of urls
        ) {
          const result =
            z
              .string()
              .url()
              .safeParse(
                url
              );

          if (
            !result.success
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,

              message:
                `FRONTEND_URL inválida: ${url}`,
            });
          }
        }
      }
    ),

  JWT_SECRET: z
    .string()
    .min(
      32,
      "JWT_SECRET deve ter pelo menos 32 caracteres"
    ),

  JWT_EXPIRES_IN: z
    .string()
    .default(
      "1h"
    ),
});

// ======================================================
// VALIDATION
// ======================================================

const parsedEnv =
  envSchema.safeParse(
    process.env
  );

if (
  !parsedEnv.success
) {
  console.error(
    "❌ Variáveis de ambiente inválidas:"
  );

  console.error(
    parsedEnv
      .error
      .flatten()
      .fieldErrors
  );

  process.exit(1);
}

// ======================================================
// EXPORT
// ======================================================

export const env =
  parsedEnv.data;