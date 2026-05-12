import fs from "node:fs";
import path from "node:path";
import { env } from "@/config/env.config";
import type { backupOptions } from "@/types";
import { backupOptionsArray } from "@/types";
import { runSystemCommand } from "@/utils/runSystemCommand";

function resolveBackupFilePath(type: backupOptions, filename: string): string {
	if (path.basename(filename) !== filename) {
		throw new Error(
			"Invalid backup filename. Directory separators are not allowed.",
		);
	}

	const typeDir = path.resolve(__dirname, "../../db-backups", type);
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

	console.log(`Dropping database: ${env.DATABASE_DB}`);
	await runSystemCommand(
		"psql",
		[
			...connectionArgs,
			"-d",
			"postgres",
			"-c",
			`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${env.DATABASE_DB}' AND pid <> pg_backend_pid()`,
		],
		pgEnv,
	);
	await runSystemCommand(
		"psql",
		[
			...connectionArgs,
			"-d",
			"postgres",
			"-c",
			`DROP DATABASE IF EXISTS ${env.DATABASE_DB}`,
		],
		pgEnv,
	);

	console.log(`Recreating database: ${env.DATABASE_DB}`);
	await runSystemCommand(
		"psql",
		[
			...connectionArgs,
			"-d",
			"postgres",
			"-c",
			`CREATE DATABASE ${env.DATABASE_DB}`,
		],
		pgEnv,
	);

	console.log(`Restoring database from: ${filepath}`);
	await runSystemCommand(
		"psql",
		[...connectionArgs, "-d", env.DATABASE_DB, "-f", filepath],
		pgEnv,
	);

	console.log("Restore complete.");
}
