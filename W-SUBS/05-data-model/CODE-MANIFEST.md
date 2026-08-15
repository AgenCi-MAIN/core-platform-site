# data-model — code manifest (the lane's territory)

- `db/schema.ts — the ORM's view`
- `db/sql/ — the LIVE migration path (never apply both trees)`
- `drizzle/ — generated migrations + snapshots (comparison only)`
- `app/portal/read-guard.ts — the second-table read contract`
