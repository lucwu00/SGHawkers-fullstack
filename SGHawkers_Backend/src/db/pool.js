import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME     || "sghawkers",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max:      20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error", err);
});

// Helper: run a query and return rows
export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.LOG_QUERIES === "true") {
    console.log("query", { text, duration, rows: res.rowCount });
  }
  return res;
}

// Helper: get a client for transactions
export async function getClient() {
  const client = await pool.connect();
  const release = client.release.bind(client);
  client.release = () => {
    client.release = release;
    return release();
  };
  return client;
}

export default pool;
