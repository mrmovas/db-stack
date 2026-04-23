import { migrator } from "@/config/migrator.config";
import type { CommandAction } from "@/types";
import { migrationInfo, showMigrationHistory } from "@/utils/migrate";
import { createDatabaseBackup } from "@/utils/pgDump";

export async function migrate(action: CommandAction<"migrate">): Promise<void> {
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
	await createDatabaseBackup();

	/**
	 * Run the migration based on the action.
	 */
	const { results } = await (async () => {
		switch (action) {
			case "up":
				return await migrator.migrateUp();
			case "upToLatest":
				return await migrator.migrateToLatest();
			case "down":
				return await migrator.migrateDown();
			default:
				throw new Error("Invalid migrate action");
		}
	})();

	results?.forEach((it) => {
		if (it.status === "Success") {
			if (action === "up")
				console.log(`✅ migration "${it.migrationName}" applied`);
			else if (action === "down")
				console.log(`↩️  migration "${it.migrationName}" rolled back`);
		} else if (it.status === "Error") {
			console.error(`❌ failed: "${it.migrationName}"`);
		}
	});
}
