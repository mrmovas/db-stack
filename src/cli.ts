import { backupCommand } from "./commands/backup";
import { helpCommand } from "./commands/help";
import { migrateCommand } from "./commands/migrate";
import { closeDatabase, testConnection } from "./config/database.config";
import { getCommand } from "./utils/getCommand";

const main = async (): Promise<void> => {
	const getCommandResult = getCommand();

	if (!getCommandResult.success) {
		if (getCommandResult.error) console.error(getCommandResult.error);
		return process.exit(1);
	}

	const dbConnected = await testConnection();
	if (!dbConnected) {
		console.error("Failed to connect to database");
		process.exit(1);
	}

	const { direction, action, option, value } = getCommandResult;

	if (direction === "help") await helpCommand();
	if (direction === "migrate") await migrateCommand(action);
	else if (direction === "backup") await backupCommand(action, option, value);

	closeDatabase();
};

main();
