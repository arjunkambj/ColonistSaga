# Catansaga Convex backend

The MVP backend stores rooms, seats, private serialized game states, and idempotent action records. Public operations are implemented in `mvp.ts`; `schema.ts` contains only the tables used by that adapter.

Run Convex commands from the repository root:

```bash
pnpm dev:setup
pnpm dev:server
pnpm --filter @catansaga/backend check-types
```

Do not edit `_generated` manually. Regenerate it with `pnpm --filter @catansaga/backend exec convex dev --once` after changing functions or schema. Put backend secrets in the Convex dashboard.
