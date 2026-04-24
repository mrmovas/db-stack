import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import { env } from "@/config/env.config";

// PG POOL
export const pool = new Pool({
	host: env.DATABASE_HOST,
	port: env.DATABASE_PORT,
	user: env.DATABASE_USER,
	password: env.DATABASE_PASSWORD,
	database: env.DATABASE_DB,
});

// KYSELY CLIENT (singleton)
// biome-ignore lint/suspicious/noExplicitAny: It's important to use `any` here, migrations should never depend on the current code of your app because they need to work even when the app changes. Migrations need to be "frozen in time".
export const db = new Kysely<any>({
	dialect: new PostgresDialect({ pool }),
});

// TEST CONNECTION
export const testConnection = async (): Promise<boolean> => {
	try {
		await sql`SELECT 1`.execute(db);
		console.log("Database connection established");
		return true;
	} catch (error) {
		console.error("Database connection failed", { error });
		return false;
	}
};

// GRACEFUL SHUTDOWN
export const closeDatabase = async (): Promise<void> => {
	try {
		await db.destroy();
		console.log("Database connections closed");
	} catch (error) {
		console.error("Error closing database connections", { error });
	}
};
