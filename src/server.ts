import { app } from "./app";
import { env } from "./config/env";
import { pool } from "./database/connection";

async function startServer() {
  try {
    await pool.query("SELECT 1");

    console.log("✅ PostgreSQL conectado");

    app.listen(env.PORT, () => {
      console.log(
        `🚀 NexaDesk API rodando em http://localhost:${env.PORT}`
      );
    });
  } catch (error) {
    console.error(
      "❌ Não foi possível conectar ao PostgreSQL:",
      error
    );

    process.exit(1);
  }
}

startServer();