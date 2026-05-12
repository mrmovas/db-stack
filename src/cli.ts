import { Command } from "commander";
import { backupCreate, backupList, backupRestore } from "@/commands/backup";
import { migrateCommand } from "@/commands/migrate";
import { closeDatabase, testConnection } from "@/config/database.config";

const withDb = (fn: () => Promise<void>) => async () => {
	const connected = await testConnection();
	if (!connected) {
		console.error("Failed to connect to database");
		process.exit(1);
	}
	try {
		await fn();
	} finally {
		await closeDatabase();
	}
};

const program = new Command();
program
	.name("db-stack")
	.description("Database management CLI")
	.version("1.0.0");

const migrate = program
	.command("migrate")
	.description("Run database migrations");
migrate
	.command("up")
	.description("Run the next pending migration")
	.action(withDb(() => migrateCommand("up")));
migrate
	.command("upToLatest")
	.description("Run all pending migrations")
	.action(withDb(() => migrateCommand("upToLatest")));
migrate
	.command("down")
	.description("Roll back the last migration")
	.action(withDb(() => migrateCommand("down")));
migrate
	.command("history")
	.description("Show migration history")
	.action(withDb(() => migrateCommand("history")));

const backup = program.command("backup").description("Manage database backups");
backup
	.command("create")
	.description("Create a manual backup")
	.action(withDb(backupCreate));
backup
	.command("list [type]")
	.description("List backups (manual, pre-migration, or both if omitted)")
	.action((type) => backupList(type));
backup
	.command("restore <type> <file>")
	.description("Restore from a backup file")
	.action((type, file) => backupRestore(type, file));

program.parse();
