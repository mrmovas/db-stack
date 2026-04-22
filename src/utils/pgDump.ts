import { exec } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import { env } from "@/config/env.config";

const execAsync = promisify(exec);

export async function createDatabaseBackup(): Promise<string> {
	const backupDir = "./db-backup";
	fs.mkdirSync(backupDir, { recursive: true });

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const filename = `backup-${env.DATABASE_NAME}-${timestamp}.sql`;
	const filepath = path.join(backupDir, filename);

	const command = `pg_dump -h ${env.DATABASE_HOST} -p ${env.DATABASE_PORT} -U ${env.DATABASE_USER} -d ${env.DATABASE_NAME} -f ${filepath}`;

	await execAsync(command, {
		env: { ...process.env, PGPASSWORD: env.DATABASE_PASSWORD },
	});

	console.log(`Backup created: ${filepath}`);
	return filepath;
}
