import type { CommandAction } from "@/types";
import { migrationInfo, showMigrationHistory } from "@/utils/migrate";

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

	// TODO: Create a backup before running migrations

	// TODO: Run the migrations based on the action (up, upToLatest, down)
}
