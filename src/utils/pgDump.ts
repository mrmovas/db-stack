import * as fs from "node:fs";
import * as path from "node:path";
import { env } from "@/config/env.config";
import { runSystemCommand } from "@/utils/runSystemCommand";

export async function createDatabaseBackup(
	trigger: "manual" | "pre-migration" | "scheduled",
): Promise<string> {
	const backupDir = `./db-backups/${trigger}`;
	fs.mkdirSync(backupDir, { recursive: true });

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const filename = `${trigger}-backup-${env.DATABASE_DB}-${timestamp}.sql`;
	const filepath = path.join(backupDir, filename);
	const args = [
		"-h",
		env.DATABASE_HOST,
		"-p",
		String(env.DATABASE_PORT),
		"-U",
		env.DATABASE_USER,
		"-d",
		env.DATABASE_DB,
		"-f",
		filepath,
	];

	await runSystemCommand("pg_dump", args, {
		...process.env,
		PGPASSWORD: env.DATABASE_PASSWORD,
	});

	console.log(`Backup created: ${filepath}`);
	return filepath;
}
