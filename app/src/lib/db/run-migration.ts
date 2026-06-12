import { db } from "./index";
import * as fs from "fs";
import * as path from "path";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const migrationsDir = path.join(process.cwd(), "src/lib/db/migrations");
    
    const customSqlFiles = [
      "0001_proc_and_triggers.sql"];

    console.log("Injecting custom SQL code into database...");

    for (const fileName of customSqlFiles) {
      const filePath = path.join(migrationsDir, fileName);
      
      if (fs.existsSync(filePath)) {
        console.log(`Applying: ${fileName}`);
        const sqlString = fs.readFileSync(filePath, "utf-8");
        await db.execute(sql.raw(sqlString));
      } else {
        console.log(`File not found, skipping: ${fileName}`);
      }
    }

    console.log("All custom procedures and triggers are successfully applied!");
    process.exit(0);
  } catch (error) {
    console.error("Error during custom migration:", error);
    process.exit(1);
  }
}

main();