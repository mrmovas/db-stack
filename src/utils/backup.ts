import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { env } from "@/config/env.config";
import type { backupOptions } from "@/types";
import { backupOptionsArray } from "@/types";

function runPsql(args: string[], pgEnv: NodeJS.ProcessEnv): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn("psql", args, {
			env: pgEnv,
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
					`psql failed with exit code ${code}${stderr ? `: ${stderr.trim()}` : ""}`,
				),
			);
		});
	});
}

function escapeSqlLiteral(value: string): string {
	return value.replace(/'/g, "''");
}

function quoteSqlIdentifier(identifier: string): string {
	return `"${identifier.replace(/"/g, '""')}"`;
}

function resolveBackupFilePath(type: backupOptions, filename: string): string {
	if (path.basename(filename) !== filename) {
		throw new Error(
			"Invalid backup filename. Directory separators are not allowed.",
		);
	}

	const typeDir = path.resolve(process.cwd(), "db-backups", type);
	const filepath = path.resolve(typeDir, filename);

	if (!filepath.startsWith(`${typeDir}${path.sep}`)) {
		throw new Error("Invalid backup file path.");
	}

	return filepath;
}

/**
 * Lists backup folders for the specified type(s).
 * If no type is specified, lists all backup types.
 * @param option
 */
export async function listBackups(option?: backupOptions): Promise<void> {
	const LIMIT = 10;

	const targets: backupOptions[] =
		option === undefined ? backupOptionsArray : [option];

	const backupRoot = path.join(__dirname, "../../db-backups");
	console.log(`Showing backup folders (limit ${LIMIT}).`);

	for (const type of targets) {
		const typeDir = path.join(backupRoot, type);

		if (!fs.existsSync(typeDir)) {
			console.log(`\n${type}: no backup folder found.`);
			continue;
		}

		const entries = await fs.promises.readdir(typeDir, { withFileTypes: true });
		const items = entries
			.map((entry) => entry.name)
			.sort((a, b) => b.localeCompare(a))
			.slice(0, LIMIT);

		console.log(`\n${type} backups (limit ${LIMIT}):`);

		if (items.length === 0) {
			console.log("- none");
			continue;
		}

		for (const item of items) {
			console.log(`- ${item}`);
		}
	}
}

/**
 * Restores a database backup of the specified folder type with the given filename.
 * @param type the backup folder type: "manual", "pre-migration", or "scheduled"
 * @param filename the name of the backup file to restore (must be located in the corresponding folder)
 */
export async function restoreDatabaseBackup(
	type: backupOptions,
	filename: string,
): Promise<void> {
	const filepath = resolveBackupFilePath(type, filename);

	if (!fs.existsSync(filepath)) {
		console.error(`Backup file not found: ${filepath}`);
		process.exit(1);
	}

	const pgEnv = { ...process.env, PGPASSWORD: env.DATABASE_PASSWORD };
	const connectionArgs = [
		"-h",
		env.DATABASE_HOST,
		"-p",
		String(env.DATABASE_PORT),
		"-U",
		env.DATABASE_USER,
	];
	const dbNameLiteral = escapeSqlLiteral(env.DATABASE_DB);
	const dbNameIdentifier = quoteSqlIdentifier(env.DATABASE_DB);

	console.log(`Dropping database: ${env.DATABASE_DB}`);
	await runPsql(
		[
			...connectionArgs,
			"-d",
			"postgres",
			"-c",
			`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbNameLiteral}' AND pid <> pg_backend_pid()`,
		],
		pgEnv,
	);
	await runPsql(
		[
			...connectionArgs,
			"-d",
			"postgres",
			"-c",
			`DROP DATABASE IF EXISTS ${dbNameIdentifier}`,
		],
		pgEnv,
	);

	console.log(`Recreating database: ${env.DATABASE_DB}`);
	await runPsql(
		[
			...connectionArgs,
			"-d",
			"postgres",
			"-c",
			`CREATE DATABASE ${dbNameIdentifier}`,
		],
		pgEnv,
	);

	console.log(`Restoring database from: ${filepath}`);
	await runPsql(
		[...connectionArgs, "-d", env.DATABASE_DB, "-f", filepath],
		pgEnv,
	);

	console.log("Restore complete.");
}
