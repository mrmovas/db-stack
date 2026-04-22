import { CommandDirection, CommandAction } from "@/types";

type CommandSuccessResult<P extends CommandDirection> =
	| {
			success: true;
			direction: P;
			action: CommandAction<P>;
	  }
	| {
			success: true;
			direction: P;
			action: CommandAction<P>;
	  };

type getCommandResult =
	| CommandSuccessResult<CommandDirection>
	| {
			success: false;
			error?: string;
	  };

export function getCommmand(): getCommandResult {
	const direction = process.argv[2];
	const action = process.argv[3];

	switch (direction) {
		case "help": {
			console.log(
				"Usage: `tsx src/index.ts <migrate|backup> <action>`",
				"   Migrate actions: `up`, `upToLatest`, `down`",
				"   Backup actions: `create`, `restore`",
			);
			return {
				success: false,
				error: undefined,
			};
		}

		case "migrate": {
			if (action != "up" && action != "upToLatest" && action != "down") {
				return {
					success: false,
					error: "Invalid migrate action. Use `up`, `upToLatest`, or `down`.",
				};
			}

			return {
				success: true,
				direction,
				action,
			};
		}

		case "backup": {
			if (action != "create" && action != "restore") {
				return {
					success: false,
					error: "Invalid backup action. Use `create` or `restore`.",
				};
			}

			return {
				success: true,
				direction,
				action,
			};
		}

		default:
			return {
				success: false,
				error: "Invalid command. Use `migrate` or `backup`.",
			};
	}
}
