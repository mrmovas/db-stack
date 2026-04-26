import { listBackups, restoreDatabaseBackup } from "@/utils/backup";
import { createDatabaseBackup } from "@/utils/pgDump";

export async function backupCreate(): Promise<void> {
	await createDatabaseBackup("manual");
}

export async function backupList(type?: string): Promise<void> {
	if (
		type !== undefined &&
		type !== "manual" &&
		type !== "pre-migration" &&
		type !== "scheduled"
	) {
		console.error(
			`Invalid type "${type}". Use: manual, pre-migration, scheduled, or omit for both`,
		);
		process.exit(1);
	}
	await listBackups(type);
}

export async function backupRestore(type: string, file: string): Promise<void> {
	if (type !== "manual" && type !== "pre-migration" && type !== "scheduled") {
		console.error(
			`Invalid type "${type}". Use: manual, pre-migration, or scheduled`,
		);
		process.exit(1);
	}
	await restoreDatabaseBackup(type, file);
}
