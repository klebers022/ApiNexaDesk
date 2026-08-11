import { app } from "./app";
import { env } from "./config/env";
import { pool } from "./database/connection";

const server = app.listen(
  env.PORT,
  () => {
    console.log(
      `🚀 NexaDesk API rodando em http://localhost:${env.PORT}`
    );
  }
);

async function shutdown(
  signal: string
) {
  console.log(
    `\n🛑 ${signal} recebido. Encerrando aplicação...`
  );

  server.close(
    async () => {
      try {
        await pool.end();

        console.log(
          "✅ Conexões com banco encerradas."
        );

        process.exit(0);
      } catch (error) {
        console.error(
          "❌ Erro ao encerrar aplicação:",
          error
        );

        process.exit(1);
      }
    }
  );
}

process.on(
  "SIGTERM",
  () =>
    shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () =>
    shutdown("SIGINT")
);