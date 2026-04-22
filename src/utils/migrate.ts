import { migrator } from "@/config/migrator.config";

/**
 * Prints a table of all migrations with their execution status and execution date (if executed).
 */
export async function showMigrationHistory(): Promise<void> {
	/**
	 * `migrator.getMigrations()` returns an array of all migration files.
	 *
	 * Each migration file is represented as an object with the following properties:
	 * - `name`: The name of the migration file (e.g., "YYYY-MM-DD-suffix.ts").
	 * - `migrator`: The migrator `up` and `down` functions defined.
	 * - `executedAt`: A Date object representing when the migration was executed, or undefined if it has not been executed yet.
	 */
	const migrationInfo = await migrator.getMigrations();
	let totalAvailableUpMigrations = 0;

	console.table(
		migrationInfo.map((migration) => {
			if (migration.executedAt === undefined) totalAvailableUpMigrations++;

			return {
				name: migration.name,
				status: migration.executedAt ? "Executed" : "Not executed",
				executedAt: migration.executedAt?.toISOString() ?? "-",
			};
		}),
	);

	if (totalAvailableUpMigrations > 0) {
		console.log(
			`Total available "up" migrations: ${totalAvailableUpMigrations}`,
		);
	} else {
		console.log('No available "up" migrations. Database is up to date!');
	}
}

/**
 * Retrieves information about available and executed migrations.
 * @returns An object containing two boolean properties: `hasAvailableMigrations` and `hasExecutedMigrations`.
 * - `hasAvailableMigrations`: Indicates if there are any migrations that have not been executed yet (i.e., pending "up" migrations).
 * - `hasExecutedMigrations`: Indicates if there are any migrations that have already been executed (i.e., "up" migrations that have been run).
 */
export async function migrationInfo(): Promise<{
	hasAvailableMigrations: boolean;
	hasExecutedMigrations: boolean;
}> {
	const migrationInfo = await migrator.getMigrations();
	return {
		hasAvailableMigrations: migrationInfo.some(
			(m) => m.executedAt === undefined,
		),
		hasExecutedMigrations: migrationInfo.some(
			(m) => m.executedAt !== undefined,
		),
	};
}
