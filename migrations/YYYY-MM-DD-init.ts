import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema.createTable('authors')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('name', 'text', (col) => col.notNull())
        .execute()

    await db.schema.createTable('books')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('title', 'text', (col) => col.notNull())
        .addColumn('authorID', 'uuid', (col) => col.notNull())
        .addForeignKeyConstraint('fk_author_id', ['authorID'], 'authors', ['id'])
        .execute()

}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable('books').execute()
    await db.schema.dropTable('authors').execute()
}