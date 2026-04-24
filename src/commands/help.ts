export async function helpCommand(): Promise<void> {
	console.log(
		`
Usage: tsx src/index.ts <direction> <action> ?[options] ?[value]

  Directions:      help, migrate, backup
  Migrate actions: up, upToLatest, down, history
  Backup actions:  create, restore, list
    - tsx src/index.ts backup list <manual|pre-migration>
      # If no type flag is provided, it shows both

    - tsx src/index.ts backup restore <manual|pre-migration|scheduled> <backup-file-name>
`.trimStart(),
	);
}
