# ColonistSaga

ColonistSaga is a real-time, reconnect-safe three- or four-player island board game built with Next.js, Convex, and a deterministic TypeScript rules engine. The current game supports one canonical 19-hex Base layout; custom layouts and expansions are deferred.

## Features

- Quick Play against two or three paced deterministic bots with Easy, Medium, and Hard strategies.
- Private three- or four-seat rooms with atomic bot, timer, victory-target, discard, dice, robber, and bank-visibility settings.
- Canonical 19-tile board, nine port-aware bank ratios, domestic trade offers, snake setup, production, robber/discard/steal, construction, and a configurable victory target.
- Server-authoritative, revisioned commands with idempotent retries.
- Hexclave-authenticated player sessions and reactive reconnect through Convex.
- Private player hands and server-only random state.
- Full-viewport, keyboard-accessible game controls using the generated terrain, resource, piece, and trade art pack.

The implemented state model and command contract are documented in [docs/game-schema.md](docs/game-schema.md). The complete art inventory is in [docs/game-asset-manifest.md](docs/game-asset-manifest.md).

## Local setup

Install dependencies and configure a Convex development deployment:

```bash
pnpm install
pnpm dev:setup
```

Convex writes its deployment values to `packages/backend/.env.local`. Copy the deployment URL into the ignored file `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

`pnpm dev` starts the local Hexclave dashboard, syncs `hexclave.config.ts`, injects the public Hexclave project values into the web process, and sets the matching `HEXCLAVE_PROJECT_ID` on the Convex development deployment. Backend environment values belong in Convex, not in the web app. A publishable client key is only needed when `requirePublishableClientKey` is enabled. This integration uses individual accounts only; it does not enable Hexclave Teams.

Run the backend and web app together:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). To run only the web client against an already-running Convex deployment, use `pnpm dev:web`.

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
docs                        Game study, schema, assets, and QA notes
```

Do not edit `packages/backend/convex/_generated` manually; regenerate it through Convex. Backend values belong in the Convex dashboard, while the web client receives only explicitly public `NEXT_PUBLIC_*` values.
