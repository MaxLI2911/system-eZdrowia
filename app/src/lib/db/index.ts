import { drizzle } from "drizzle-orm/node-postgres";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:54325/database";

export const db = drizzle(DATABASE_URL);
export const pool = db.$client;
