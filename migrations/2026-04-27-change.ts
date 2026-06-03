import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    db.schema.createTable('reports')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('title', 'text', (col) => col.notNull())
        .addColumn('content', 'text', (col) => col.notNull())
        .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
    db.schema.dropTable('reports').execute()
}