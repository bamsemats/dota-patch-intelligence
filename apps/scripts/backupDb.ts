// apps/scripts/backupDb.ts

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { mkdir } from "node:fs/promises";
import * as path from "node:path";

const execAsync = promisify(exec);
const BACKUP_DIR = path.resolve("research-output", "backups");

async function main() {
  console.log("[Backup] Initializing database backup...");
  
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `dota_patch_intel_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    // We assume the user has pg_dump in their PATH and the DB name is correct
    // From previous logs, DB is "dota_patch_intel" on "localhost:5432"
    console.log(`[Backup] Creating dump: ${filename}...`);
    
    // Using credentials from .env
    const command = `docker exec dota-patch-db pg_dump -U root dota_patch_intel -O -x > "${filepath}"`;
    
    console.log(`[Backup] Running command: docker exec dota-patch-db pg_dump...`);
    await execAsync(command);
    
    console.log(`[Backup] Success! Database backed up to ${filepath}`);
  } catch (error: any) {
    console.error("[Backup] Failed:", error.message);
    if (error.stderr) console.error("[Backup] Stderr:", error.stderr);
    
    console.log("\n[Note] Make sure 'pg_dump' is installed and your PostgreSQL service is running.");
    console.log("[Note] Default command attempted: pg_dump -U postgres -d dota_patch_intel");
  }
}

main().catch(console.error);
