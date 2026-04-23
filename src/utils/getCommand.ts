import type {
	CommandAction,
	CommandDirection,
	CommandOption,
	CommandValue,
} from "@/types";

type CommandSuccessResult<P extends CommandDirection> = {
	success: true;
	direction: P;
	action: CommandAction<P>;
	option: CommandOption<CommandAction<P>>;
	value: CommandValue<CommandAction<P>>;
};

type getCommandResult =
	| { [P in CommandDirection]: CommandSuccessResult<P> }[CommandDirection]
	| { success: false; error?: string };

export function getCommand(): getCommandResult {
	const direction = process.argv[2];
	const action = process.argv[3];
	const option = process.argv[4];
	const value = process.argv[5];

	if (!direction || typeof direction !== "string") {
		return {
			success: false,
			error:
				"Command direction is required. Use `migrate`, `backup`, or `help`.",
		};
	}

	switch (direction) {
		case "help": {
			return {
				success: true,
				direction: "help",
				action: undefined,
				option: undefined,
				value: undefined,
			};
		}

		case "migrate": {
			if (action !== "up" && action !== "upToLatest" && action !== "down") {
				return {
					success: false,
					error: "Invalid migrate action. Use `up`, `upToLatest`, or `down`.",
				};
			}

			return {
				success: true,
				direction: "migrate",
				action: action,
				option: undefined,
				value: undefined,
			};
		}

		case "backup": {
			if (action !== "create" && action !== "restore" && action !== "list") {
				return {
					success: false,
					error: "Invalid backup action. Use `create`, `restore`, or `list`.",
				};
			}

			if (action === "restore") {
				if (
					option !== "manual" &&
					option !== "pre-migration" &&
					option !== "scheduled"
				) {
					return {
						success: false,
						error:
							"Invalid backup option. Use `manual`, `pre-migration`, or `scheduled`.",
					};
				}

				if (!value && typeof value !== "string") {
					return {
						success: false,
						error: "Backup file name is required for restore action.",
					};
				}
			}

			if (action === "list") {
				if (
					option !== "manual" &&
					option !== "pre-migration" &&
					option !== undefined
				) {
					return {
						success: false,
						error:
							"Invalid backup option. Use `manual`, `pre-migration`, or no option.",
					};
				}
			}

			return {
				success: true,
				direction: "backup",
				action: action,
				option: option,
				value: value,
			};
		}

		default: {
			void (direction as never);
			return {
				success: false,
				error: "Invalid command. Use `migrate` or `backup`.",
			};
		}
	}
}
