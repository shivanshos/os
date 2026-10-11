# AGENTS.md

Notes for engineers (and agents) working in this repository.

## What this is

`os` is a **Cloudflare Worker** built with **Hono**, using a **Durable Object**
(`AgentStateDO`) for per-agent state. It is not a Node/Express server — there is
no `app.listen()` and no `PORT` env var to configure.

- Entry point: `src/index.ts` (Hono app + `export default app`)
- Durable Object: `src/agent-state-do.ts`
- State schema: `src/types.ts` (`AgentState`, `AgentMessage`, `AgentUsage`)
- Bindings type: `src/env.ts`
- Worker config: `wrangler.os.toml` (non-default filename, so always pass `-c wrangler.os.toml`)

## Running it

The Base44 sandbox uses `docker-compose.base44.yml`, which runs `wrangler dev`
(local workerd/Miniflare) from the bind-mounted source on host port **3000**:

```
docker compose -f docker-compose.base44.yml up -d --build
docker compose -f docker-compose.base44.yml logs -f web
```

`wrangler dev` compiles from source on each request, so source edits are picked
up without a rebuild. Config/dependency changes need `docker compose ... up -d`.
Outside the sandbox: `npm install && npm run dev`.

## Verifying

- `curl http://localhost:3000/health` → `{"status":"ok"}`
- `curl http://localhost:3000/agents/demo/state` → full agent record
- Type check: `docker compose -f docker-compose.base44.yml exec -T web npx tsc --noEmit`

## Quirks worth knowing

- **Durable Object storage key.** The whole agent record lives under one key,
  `state`, in the DO's storage. Local DO state is written to `.wrangler/state/`
  (gitignored) — deleting `.wrangler/` resets every agent record.
- **Per-agent isolation.** `/agents/:id/*` resolves a DO via `idFromName(id)`, so
  two ids are always two independent agent records.
- **`id`/`createdAt` are immutable.** `AgentStateDO.patch()` re-applies them even
  if a caller sends different values.
- **Migrations.** Adding another Durable Object class requires a new
  `[[migrations]]` block with a new tag in `wrangler.os.toml`; never edit an
  already-applied migration.
- **Deploys** (`npm run deploy`) target Cloudflare and need real credentials —
  none are configured in the sandbox.
