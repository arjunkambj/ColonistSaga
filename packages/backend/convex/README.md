# ColonistSaga Convex backend

The backend stores rooms, seats, private serialized game states, and idempotent action records. Public operations are organized by domain in `rooms.ts`, `games.ts`, and `automation.ts`; `schema.ts` defines their persistent tables.

Run Convex commands from the repository root:

```bash
pnpm dev:setup
pnpm dev:server
pnpm --filter @colonistsaga/backend check-types
```

Do not edit `_generated` manually. Regenerate it with `pnpm --filter @colonistsaga/backend exec convex dev --once` after changing functions or schema. Put backend secrets in the Convex dashboard.
