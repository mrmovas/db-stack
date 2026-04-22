import { backup } from "./commands/backup";
import { migrate } from "./commands/migrate";
import { closeDatabase, testConnection } from "./config/database.config";
import { getCommmand } from "./utils/getCommand";

const main = async (): Promise<void> => {
	const getCommandResult = getCommmand();

	if (!getCommandResult.success) {
		if (getCommandResult.error) console.error(getCommandResult.error);
		return process.exit(1);
	}

	const dbConnected = await testConnection();
	if (!dbConnected) {
		console.error("Failed to connect to database");
		process.exit(1);
	}

	const { direction, action } = getCommandResult;

	if (direction === "migrate") await migrate(action);
	else if (direction === "backup") await backup(action);

	closeDatabase();
};

main();
