import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { env } from "@/config/env.config";

function runCommand(
	command: string,
	args: string[],
	envVars: NodeJS.ProcessEnv,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			env: envVars,
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stderr = "";
		child.stderr.on("data", (chunk) => {
			stderr += chunk.toString();
		});

		child.on("error", (error) => {
			reject(error);
		});

		child.on("close", (code) => {
			if (code === 0) {
				resolve();
				return;
			}
			reject(
				new Error(
					`${command} failed with exit code ${code}${stderr ? `: ${stderr.trim()}` : ""}`,
				),
			);
		});
	});
}

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

	await runCommand("pg_dump", args, {
		...process.env,
		PGPASSWORD: env.DATABASE_PASSWORD,
	});

	console.log(`Backup created: ${filepath}`);
	return filepath;
}
