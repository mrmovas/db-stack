import fs from "node:fs";
import path from "node:path";
import cron from "node-cron";
import { env } from "@/config/env.config";
import { createDatabaseBackup } from "@/utils/pgDump";

const SCHEDULED_BACKUP_DIR = path.join(__dirname, "../../db-backups/scheduled");

function now(): string {
	return new Date().toLocaleString(env.SCHEDULED_LOCALE, {
		timeZone: env.SCHEDULED_TIMEZONE,
	});
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(seconds: number): string {
	if (seconds >= 60 * 60) return `${seconds / (60 * 60)} hours`;
	if (seconds >= 60) return `${seconds / 60} minutes`;
	return `${seconds} seconds`;
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
		console.log(
			`[${now()}] Retrying ${env.MAX_ATTEMPTS_ON_BACKUP_FAILURE} more time(s) with ${formatDuration(env.RETRY_DELAY_SECONDS)} between attempts...`,
		);

		for (
			let attemptCount = 1;
			attemptCount <= env.MAX_ATTEMPTS_ON_BACKUP_FAILURE;
			attemptCount++
		) {
			await sleep(env.RETRY_DELAY_SECONDS * 1000);
			try {
				await createDatabaseBackup("scheduled");
				await deleteOldBackups();
				console.log(`[${now()}] Scheduled backup complete.`);
				break;
			} catch (retryErr) {
				console.error(`[${now()}] Retry ${attemptCount} failed:`, retryErr);
			}
		}
	}
}

if (!cron.validate(env.SCHEDULED_TIME)) {
	console.error(`Invalid cron expression: "${env.SCHEDULED_TIME}"`);
	process.exit(1);
}

/**
 * Note, the cron was made in mind to run once a day or less frequently.
 * If you set it to run more often, be aware that if a backup takes longer than the interval between runs,
 * it may cause overlapping executions. In such cases, consider implementing a locking mechanism to prevent multiple backups from running simultaneously.
 * For example in case of a failed backup that keeps retrying, the next scheduled backup will start before the previous one finishes,
 */
cron.schedule(env.SCHEDULED_TIME, runScheduledBackup);

console.log(
	`[${now()}] Scheduler started. Cron: "${env.SCHEDULED_TIME}", retention: ${env.SCHEDULED_BACKUP_RETENTION_DAYS} days.`,
);
