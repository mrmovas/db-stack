export type migrateActions = "up" | "upToLatest" | "down" | "history";

export type backupOptions = "manual" | "pre-migration" | "scheduled";
export const backupOptionsArray: backupOptions[] = [
	"manual",
	"pre-migration",
	"scheduled",
] satisfies backupOptions[];
