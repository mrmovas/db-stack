import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { backupOptions } from "@/types";
import { backupOptionsArray } from "@/types";
import { env } from "@/config/env.config";

const execAsync = promisify(exec);

/**
 * Lists backup folders for the specified type(s).
 * If no type is specified, lists both "manual" and "pre-migration" backups.
 * @param option 
 */
export async function listBackups(option?: backupOptions): Promise<void> {
	const LIMIT = 10;

	const targets: backupOptions[] = option === undefined 
        ? backupOptionsArray 
        : [option];

	const backupRoot = path.join(__dirname, "../../db-backups");
	console.log(`Showing backup folders (limit ${LIMIT}).`);

	for (const type of targets) {
		if (typeof type !== "string" || !type) continue; // temp fix?

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
    const filepath = path.join(`./db-backups/${type}`, filename);

    if (!fs.existsSync(filepath)) {
        console.error(`Backup file not found: ${filepath}`);
        process.exit(1);
    }

    const pgEnv = { env: { ...process.env, PGPASSWORD: env.DATABASE_PASSWORD } };
    const connectionFlags = `-h ${env.DATABASE_HOST} -p ${env.DATABASE_PORT} -U ${env.DATABASE_USER}`;

    console.log(`Dropping database: ${env.DATABASE_DB}`);
    await execAsync(
        `psql ${connectionFlags} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${env.DATABASE_DB}' AND pid <> pg_backend_pid()"`,
        pgEnv,
    );
    await execAsync(
        `psql ${connectionFlags} -d postgres -c "DROP DATABASE IF EXISTS ${env.DATABASE_DB}"`,
        pgEnv,
    );

    console.log(`Recreating database: ${env.DATABASE_DB}`);
    await execAsync(
        `psql ${connectionFlags} -d postgres -c "CREATE DATABASE ${env.DATABASE_DB}"`,
        pgEnv,
    );


    console.log(`Restoring database from: ${filepath}`);
    await execAsync(
        `psql ${connectionFlags} -d ${env.DATABASE_DB} -f ${filepath}`,
        pgEnv,
    );

    console.log("Restore complete.");
}

