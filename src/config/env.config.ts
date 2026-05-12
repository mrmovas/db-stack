import { config } from "dotenv";
import { z } from "zod";

config({ quiet: true });

// DEFINING ENVIRONMENT VARIABLES SCHEMA
const envSchema = z.object({
	DATABASE_HOST: z.string().nonempty("[ENV] DATABASE_HOST is required"),
	DATABASE_PORT: z
		.string()
		.nonempty("[ENV] DATABASE_PORT is required")
		.transform(Number),
	DATABASE_USER: z.string().nonempty("[ENV] DATABASE_USER is required"),
	DATABASE_PASSWORD: z.string().nonempty("[ENV] DATABASE_PASSWORD is required"),
	DATABASE_DB: z
		.string()
		.nonempty("[ENV] DATABASE_DB is required")
		.regex(
			/^[a-zA-Z_][a-zA-Z0-9_]*$/,
			"[ENV] DATABASE_DB must match /^[a-zA-Z_][a-zA-Z0-9_]*$/",
		),

	SCHEDULED_LOCALE: z.string().default("en-US"),
	SCHEDULED_TIMEZONE: z.string().default("UTC"),
	SCHEDULED_TIME: z.string().default("0 0 * * *"), // Default: every day at 12 AM
	SCHEDULED_BACKUP_RETENTION_DAYS: z.string().default("7").transform(Number),
});

// VALIDATING ENVIRONMENT VARIABLES
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
	console.error(
		"❌ Invalid environment variables:",
		z.treeifyError(parsedEnv.error),
	);
	process.exit(1);
}

// EXPORTING ENVIRONMENT VARIABLES
export const env = parsedEnv.data;
