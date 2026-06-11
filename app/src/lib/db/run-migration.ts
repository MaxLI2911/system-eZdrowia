import { db } from "./index";
import * as fs from "fs";
import * as path from "path";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const filePath = path.join(process.cwd(), "src/lib/db/migrations/0001_proc_and_triggers.sql");
    const sqlString = fs.readFileSync(filePath, "utf-8");
    
    console.log("Injecting code into database...");
    await db.execute(sql.raw(sqlString));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();