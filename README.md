# DB-Stack

A self-hosted PostgreSQL stack meant to run externally to your application. Your app connects to it over the network while this stack handles the database itself, migrations, and backups.

Supports two modes:

- **Hosted** — PostgreSQL runs as a container inside this stack, managed here.
- **External** — PostgreSQL runs elsewhere (managed service, another server, etc.). This stack connects to it using the credentials in your `.env`.

The `app` service will run an automated backup every day at 12 AM once enabled. If a backup fails, it will automatically retry up to `MAX_ATTEMPTS_ON_BACKUP_FAILURE` times (default: 3), waiting `RETRY_DELAY_SECONDS` between each attempt (default: 1 hour).

---

## Setup

Copy `.env.example` to `.env` and fill in the required values.

### Hosted mode

`DATABASE_HOST` must be set to `postgres` (the Docker service name).

Start the database and the backup scheduler:

```bash
docker compose --profile hosted up -d
```

### External mode

Set `DATABASE_HOST` to your external database hostname and fill in the remaining credentials.

Start the backup scheduler (no local database container):

```bash
docker compose up -d
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

If using hosted mode, you can combine both profiles:

```bash
docker compose --profile hosted --profile tools up -d
```

---

## Networking

`app-net` is a bridge network scoped to this stack only. If your database runs in a separate Compose stack, create a shared network and join both stacks to it:

```bash
docker network create shared-db-net
```

Add it as external in both `docker-compose.yml` files:

```yaml
networks:
  app-net:
    driver: bridge
  shared-db-net:
    external: true
```

Then set `DATABASE_HOST` to the postgres container name from the other stack.

> If you don't need cross-stack networking, remove the `shared-db-net` entries from `docker-compose.yml` (the network declaration at the bottom and the `- shared-db-net` line under each service) — otherwise Docker Compose will fail on startup.

The `postgres` service is also attached to `shared-db-net`. This is useful in local development when your app is built to connect to an external database, instead of changing your app's config, you can run hosted mode and have your app connect to this postgres container over the shared network, treating it just like an external database. You can remove the `shared-db-net` entry from the `postgres` service if you don't need it.
