import path from "path";
import pg from "pg";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

const TEST_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:54326/database_test";

function getDbName(): string {
  return TEST_URL.split("/").pop()?.split("?")[0] ?? "database_test";
}

function getAdminUrl(): string {
  return TEST_URL.replace(/\/[^/]+$/, "/postgres");
}

async function ensureDatabase(): Promise<void> {
  const admin = new pg.Client(getAdminUrl());
  await admin.connect();

  const exists = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [getDbName()],
  );

  if (exists.rows.length > 0) {
    await admin.query(
      `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = $1 AND pid <> pg_backend_pid()`,
      [getDbName()],
    );
    await admin.query(`DROP DATABASE "${getDbName()}"`);
  }

  await admin.query(`CREATE DATABASE "${getDbName()}"`);
  await admin.end();
}

async function runMigrations(): Promise<void> {
  const db = drizzle(TEST_URL);
  try {
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, "../src/lib/db/migrations"),
    });
  } finally {
    await db.$client.end();
  }
}

export async function setup() {
  await ensureDatabase();
  await runMigrations();
}

export async function teardown() {
  const dbName = getDbName();
  const admin = new pg.Client(getAdminUrl());
  await admin.connect();

  await admin.query(
    `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = $1 AND pid <> pg_backend_pid()`,
    [dbName],
  );
  await admin.query(`DROP DATABASE IF EXISTS "${dbName}"`);
  await admin.end();
}
