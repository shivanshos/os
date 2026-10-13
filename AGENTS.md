# AGENTS.md

## Running the app here

```
docker compose -f docker-compose.base44.yml up -d --build
```

Four services:

| service   | what it is                                              | host port |
| --------- | ------------------------------------------------------- | --------- |
| `web`     | Vite dev server (React frontend), **preview entry point** | 3000      |
| `api`     | Express API (`server/`), `node --watch` dev server        | 4000      |
| `db`      | Postgres 16                                              | internal  |
| `migrate` | one-shot `psql` run of `server/db/schema.sql` + `seed.sql` | —        |

`web` is the only port the preview needs. It proxies `/api` to `api` through
`server.proxy` in `vite.config.ts` (target from `API_PROXY_TARGET`), so the
browser uses a single origin and there is no CORS configuration anywhere.

## Non-obvious setup notes

- **Dependencies live in named volumes** (`web_node_modules`, `api_node_modules`),
  never in the checkout, so installs happen from the compose `command:` on
  container start — not during an image build. First boot is slow; both app
  healthchecks allow ~2 minutes for it.
- **Vite polls for file changes** (`server.watch.usePolling`). Bind mounts from
  the sandbox do not deliver native filesystem events, so HMR silently stops
  working without it. Keep polling on.
- **`node --watch` handles API reloads.** Editing files under `server/` restarts
  the API automatically.
- **Schema and seed are idempotent** (`create table if not exists`,
  `on conflict do nothing`), because `migrate` re-runs on every start. That also
  means data created through the API survives restarts — deleting the rows is a
  deliberate act, so do not wipe `db_data` to "reset" dependencies.
- **Local DB credentials are not secrets** — `base44` / `base44_dev` are
  generated for local dev and wired inline in compose. No external service or
  environment variable is required to boot; `.base44/environment.json` lists no
  secrets.
- **StrictMode double-fetches in dev** (React 19), so the API log shows each GET
  twice on page load. Expected, not a bug.
- The preview host is allowed through Vite's own allowlist by passing
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` into the service (Vite >= 6.1 appends
  it to `server.allowedHosts`). No allowlist is hardcoded in `vite.config.ts`.

## API

All JSON, all under `/api`, reachable directly on port 4000 or through the web
origin on 3000:

- `GET /api/health` — `{ ok: true }`, also reports 503 if the DB is unreachable
- `GET /api/stats` — metric cards (`metrics` table, `trend` is a jsonb array)
- `GET /api/activity?q=` — newest first, `q` filters across actor/action/target/env/status
- `POST /api/activity` — record an event (requires actor, initials, action, target)
- `GET /api/projects` — newest first
- `POST /api/projects` — create; requires `name`, also logs an activity row
- `PATCH /api/projects/:id` — partial update (`progress`, `name`, `description`, `tags`)
- `DELETE /api/projects/:id` — 204 or 404

## Verifying it works

- `docker compose -f docker-compose.base44.yml ps` — `db`, `api`, `web` must be
  `healthy` (a `migrate` container that has exited 0 is expected).
- `curl -s http://localhost:3000/api/health` → `{"ok":true}` proves the web proxy
  and API and DB are all wired together.
- `curl -s http://localhost:3000/api/projects` should return 4 seeded projects.
- The UI loads its data from these endpoints; a fresh page load shows 4 project
  cards, 4 metric cards and 7 activity rows, and the TopBar search filters the
  activity list.
- End-to-end write check: create a project in the UI (Projects → New project) and
  confirm it appears in `GET /api/projects` and as a "created" row in `/api/activity`.
- Type check (optional): `docker compose -f docker-compose.base44.yml exec web npx tsc --noEmit`.
