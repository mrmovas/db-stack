# DB-Stack

A self-hosted PostgreSQL stack meant to run externally to your application. Your app connects to it over the network while this stack handles the database itself, migrations, and backups.

The `app` service will run an automated backup every day at 12 AM once enabled.

---

## Setup

Copy `.env.example` to `.env` and fill in the required values.

Start the database and app for auto-backups:

```bash
docker compose up postgres -d
```

---

## CLI

Build the CLI image:

```bash
docker compose build cli
```

Run commands via Docker (recommended):

```bash
docker compose run --rm cli <command>
```
`--rm` ensures the container is removed after the command finishes. Replace `<command>` with the desired command and its arguments.

Or directly with tsx (for local development):

```bash
tsx ./src/cli.ts <command>
```

---

## Migrations

Inside the `./migrations` folder you can add your migration files. Each migration file exports `up` and `down` functions that run the migration and its rollback, respectively.

You can read Kysely's migration guide [here](https://kysely.dev/docs/migrations) for more details on how to write migration files.

> ⚠️ Important: If two migration files share the same date prefix, make sure their suffixes sort correctly. An incorrect alphabetical order can cause migrations to run out of sequence or fail unexpectedly.

### Run migrations via Docker:
```bash
docker compose run --rm cli migrate up            # Run the next pending migration
docker compose run --rm cli migrate upToLatest    # Run all pending migrations
docker compose run --rm cli migrate down          # Roll back the last migration
docker compose run --rm cli migrate history       # Show migration history
```

> A `pre-migration` backup is automatically created before any migration runs.

---

## Backups

**Create a manual backup:**

```bash
docker compose run --rm cli backup create
```

**List backups:**

```bash
docker compose run --rm cli backup list                    # All backups
docker compose run --rm cli backup list manual             # Manual only
docker compose run --rm cli backup list pre-migration      # Pre-migration only
docker compose run --rm cli backup list scheduled          # Scheduled only
```

**Restore from a backup:**

```bash
docker compose run --rm cli backup restore <type> <file_name>
```

`<type>` must be `manual`, `pre-migration`, or `scheduled`. `<file_name>` must be a file that exists inside that type's folder under `db-backups/`.

Example:

```bash
docker compose run --rm cli backup restore manual manual-backup-appdb-2026-04-26T18-51-02-926Z.sql
```

---

## Tools

Adminer (database UI) is available under the `tools` profile:

```bash
docker compose --profile tools up -d
```

Then open [http://localhost:8080](http://localhost:8080).
