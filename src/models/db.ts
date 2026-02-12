import { Pool } from "pg";
import { settings } from "../config/settings";

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      host: settings.db.host,
      port: settings.db.port,
      user: settings.db.user,
      password: settings.db.password,
      database: settings.db.name
    });
  }

  return pool;
};

export const initDb = async (): Promise<void> => {
  const client = await getPool().connect();
  try {
    await client.query(
      "CREATE TABLE IF NOT EXISTS processed_reviews (" +
        "review_id VARCHAR(255) PRIMARY KEY," +
        "product_id VARCHAR(255) NOT NULL," +
        "user_id VARCHAR(255) NOT NULL," +
        "rating INTEGER NOT NULL," +
        "comment TEXT NOT NULL," +
        "sentiment VARCHAR(50) NOT NULL," +
        "processed_timestamp TIMESTAMPTZ NOT NULL" +
        ")"
    );
    await client.query("CREATE INDEX IF NOT EXISTS idx_processed_reviews_product_id ON processed_reviews (product_id)");
  } finally {
    client.release();
  }
};

export const closeDb = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
