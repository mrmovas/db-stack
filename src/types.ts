// DIRECTIONS
export type CommandDirection = "migrate" | "backup" | "help";
export const commandDirectionsArray: CommandDirection[] = [
	"migrate",
	"backup",
	"help",
] satisfies CommandDirection[];

// ACTIONS
export type migrateActions = "up" | "upToLatest" | "down" | "history";
export const migrateActionsArray: migrateActions[] = [
	"up",
	"upToLatest",
	"down",
	"history",
] satisfies migrateActions[];

export type backupActions = "create" | "restore" | "list";
export const backupActionsArray: backupActions[] = [
	"create",
	"restore",
	"list",
] satisfies backupActions[];

export type helpActions = undefined; // Help doesn't have specific actions, it just shows all commands

// OPTIONS
export type backupOptions = "manual" | "pre-migration" | "scheduled";
export const backupOptionsArray: backupOptions[] = [
	"manual",
	"pre-migration",
	"scheduled",
] satisfies backupOptions[];

// COMMAND
export type CommandAction<P extends CommandDirection> = P extends "migrate"
	? migrateActions
	: P extends "backup"
		? backupActions
		: P extends "help"
			? helpActions
			: never;

export type CommandOption<P extends CommandAction<CommandDirection>> =
	// BACKUP OPTIONS
	P extends "restore"
		? backupOptions
		: P extends "list"
			? Omit<backupOptions, "scheduled">
			: undefined;

export type CommandValue<P extends CommandAction<CommandDirection>> =
	P extends "restore"
		? string // backup file name
		: undefined;
