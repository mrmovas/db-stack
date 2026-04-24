import type { CommandAction, CommandOption, CommandValue } from "@/types";
import { listBackups } from "@/utils/backup";
import { createDatabaseBackup } from "@/utils/pgDump";

export async function backupCommand(
	action: CommandAction<"backup">,
	option: CommandOption<CommandAction<"backup">>,
	_value: CommandValue<CommandAction<"backup">>,
): Promise<void> {
	if (action === "list") return await listBackups(option);

	if (action === "create") {
		await createDatabaseBackup("manual");
		return;
	}

	if (action === "restore") {
		console.log("Restore functionality is not implemented yet.");
		return;
	}
}
