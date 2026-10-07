// Creates the tables and loads demo data the first time the app starts on an empty database.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./pool.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

export async function initDatabase() {
  const { rows } = await pool.query("SELECT to_regclass('public.centres') AS t");
  if (rows[0].t) {
    console.log("🗄️  Database already set up");
    return;
  }
  console.log("🗄️  Empty database: creating schema and loading demo data…");
  await pool.query(fs.readFileSync(path.join(dir, "schema.sql"), "utf8"));
  await pool.query(fs.readFileSync(path.join(dir, "seed.sql"), "utf8"));
  console.log("✅ Database ready");
}
