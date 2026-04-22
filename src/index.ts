import { CommandAction } from "@/types";
import { backup } from "./commands/backup";
import { migrate } from "./commands/migrate";
import { getCommmand } from "./utils/getCommand";

const main = async (): Promise<void> => {
	/**
	 * Get the command and action from the command line arguments. If the command is invalid, print an error message and exit the process with a non-zero status code.
	 */
	const getCommandResult = getCommmand();

	if (!getCommandResult.success) {
		if (getCommandResult.error) console.error(getCommandResult.error);
		return process.exit(1);
	}

	const { direction, action } = getCommandResult;

	if (direction === "migrate") await migrate(action);
	else if (direction === "backup") await backup(action);
};

main();
