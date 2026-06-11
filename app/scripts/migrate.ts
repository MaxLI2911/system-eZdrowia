import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const DATABASE_URL = process.env.DATABASE_URL!;
const MAX_RETRIES = 10;

async function main() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const db = drizzle(DATABASE_URL);
      await migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
      await db.$client.end();
      console.log("Migrations applied to", DATABASE_URL.split("@")[1] ?? DATABASE_URL);
      return;
    } catch (err) {
      if (i < MAX_RETRIES - 1) {
        console.log(`Waiting for database...`);
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        throw err;
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
