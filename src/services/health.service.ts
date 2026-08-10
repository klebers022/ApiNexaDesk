import { pool } from "../database/connection";

interface DatabaseHealth {
  databaseTime: Date;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const result = await pool.query<{ database_time: Date }>(
    `
      SELECT NOW() AS database_time;
    `
  );

  return {
    databaseTime: result.rows[0].database_time,
  };
}