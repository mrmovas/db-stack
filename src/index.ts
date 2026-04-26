import fs from "node:fs";
import path from "node:path";
import cron from "node-cron";
import { env } from "@/config/env.config";
import { createDatabaseBackup } from "@/utils/pgDump";

const SCHEDULED_BACKUP_DIR = path.join(__dirname, "../../db-backups/scheduled");

function now(): string {
	return new Date().toLocaleString(env.SCHEDULED_LOCALE);
}

async function deleteOldBackups(): Promise<void> {
	if (!fs.existsSync(SCHEDULED_BACKUP_DIR)) return;

	const cutoff =
		Date.now() - env.SCHEDULED_BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
	const entries = await fs.promises.readdir(SCHEDULED_BACKUP_DIR, {
		withFileTypes: true,
	});

	for (const entry of entries) {
		const filepath = path.join(SCHEDULED_BACKUP_DIR, entry.name);
		const stat = await fs.promises.stat(filepath);

		if (stat.mtimeMs < cutoff) {
			await fs.promises.unlink(filepath);
			console.log(`[${now()}] Deleted old backup: ${entry.name}`);
		}
	}
}

async function runScheduledBackup(): Promise<void> {
	console.log(`[${now()}] Running scheduled backup...`);
	try {
		await createDatabaseBackup("scheduled");
		await deleteOldBackups();
		console.log(`[${now()}] Scheduled backup complete.`);
	} catch (err) {
		console.error(`[${now()}] Scheduled backup failed:`, err);
	}
}

if (!cron.validate(env.SCHEDULED_TIME)) {
	console.error(`Invalid cron expression: "${env.SCHEDULED_TIME}"`);
	process.exit(1);
}

cron.schedule(env.SCHEDULED_TIME, runScheduledBackup);

console.log(
	`[${now()}] Scheduler started. Cron: "${env.SCHEDULED_TIME}", retention: ${env.SCHEDULED_BACKUP_RETENTION_DAYS} days.`,
);
