import { migrator } from "@/config/migrator.config";
import type { CommandAction } from "@/types";
import { runMigrate, migrationInfo, showMigrationHistory } from "@/utils/migrate";
import { createDatabaseBackup } from "@/utils/pgDump";

export async function migrateCommand(action: CommandAction<"migrate">): Promise<void> {
	if (action === "history") return await showMigrationHistory();

	const { hasAvailableMigrations, hasExecutedMigrations } =
		await migrationInfo();

	if (!hasAvailableMigrations && (action === "up" || action === "upToLatest")) {
		console.log("No pending migrations. Database is up to date.");
		return;
	}

	if (!hasExecutedMigrations && action === "down") {
		console.log("No executed migrations to roll back.");
		return;
	}

	/**
	 * Before running any migration (up or down), we create a backup of the database, so if anything goes wrong we can restore it.
	 */
	await createDatabaseBackup("pre-migration");

	/**
	 * Run the migration based on the action.
	 */
	await runMigrate(action);
}
