# Catansaga

Catansaga is a real-time, reconnect-safe four-player island board game built with Next.js, Convex, and a deterministic TypeScript rules engine. The current MVP intentionally supports one canonical 19-hex Base layout; custom layouts and expansions are deferred.

## MVP features

- Quick Play against three deterministic bots.
- Private rooms for up to four human players, with bot-filled empty seats.
- Canonical 19-tile board, nine port-aware trade ratios, snake setup, production, robber/discard/steal, construction, and a 10-point victory target.
- Server-authoritative, revisioned commands with idempotent retries.
- Stable guest sessions and reactive reconnect through Convex.
- Private player hands and server-only random state.
- Responsive, keyboard-accessible board controls using the generated terrain, resource, and piece pack.

The implemented state model and command contract are documented in [docs/mvp-game-schema.md](docs/mvp-game-schema.md). The complete art inventory is in [docs/game-asset-manifest.md](docs/game-asset-manifest.md).

## Local setup

Install dependencies and configure a Convex development deployment:

```bash
pnpm install
pnpm dev:setup
```

Convex writes its local deployment values to `packages/backend/.env.local`. Add the same public deployment URL to the ignored file `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Run the backend and web app together:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001). To run only the web client against an already-running Convex deployment, use `pnpm dev:web`.

## Verification

```bash
pnpm test
pnpm check-types
pnpm build
pnpm check
```

The web package can also be built and served directly:

```bash
pnpm --filter web build
pnpm --filter web start
```

## Workspace

```text
apps/web                    Next.js App Router client
apps/desktop                Electrobun shell for the static web export
packages/game               Pure deterministic game engine and tests
packages/backend/convex     Convex schema, rooms, state, and commands
packages/env                Environment validation
packages/infra              Alchemy deployment entrypoint
docs                        Game study, schema, assets, and QA notes
```

Do not edit `packages/backend/convex/_generated` manually; regenerate it through Convex. Backend secrets belong in the Convex dashboard, while the web client receives only `NEXT_PUBLIC_CONVEX_URL`.
