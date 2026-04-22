export type CommandDirection = "migrate" | "backup";

export type CommandAction<P extends CommandDirection> = P extends "migrate"
	? "up" | "upToLatest" | "down" | "history"
	: "create" | "restore";
