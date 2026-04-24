import fs from "node:fs";
import path from "node:path";
import type { CommandAction, CommandOption } from "@/types";

/**
 * Lists backup folders based on the provided option.
 * If no option is provided, it lists both "manual" and "pre-migration" backups.
 */
export async function listBackups(
	option: CommandOption<CommandAction<"backup">>,
): Promise<void> {
	const LIMIT = 10;

	const targets: CommandOption<CommandAction<"backup">>[] =
		option === undefined ? ["manual", "pre-migration"] : [option];

	const backupRoot = path.resolve(__dirname, "db-backups");
	console.log(`Showing backup folders (limit ${LIMIT}).`);

	for (const type of targets) {
		if (typeof type !== "string" || !type) continue; // temp fix?

		const typeDir = path.join(backupRoot, type);

		if (!fs.existsSync(typeDir)) {
			console.log(`\n${type}: no backup folder found.`);
			continue;
		}

		const entries = await fs.promises.readdir(typeDir, { withFileTypes: true });
		const folders = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.sort((a, b) => b.localeCompare(a))
			.slice(0, LIMIT);

		console.log(`\n${type} backups (limit ${LIMIT}):`);

		if (folders.length === 0) {
			console.log("- none");
			continue;
		}

		for (const folder of folders) {
			console.log(`- ${folder}`);
		}
	}
}
