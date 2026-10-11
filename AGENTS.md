# AGENTS.md

## Running the app here

```
docker compose -f docker-compose.base44.yml up -d --build
```

Single service, `web`: a Vite dev server on container port 5173 mapped to host
port 3000 (the preview entry point). Source is bind-mounted from the repo, so
edits hot-reload without a rebuild.

## Non-obvious setup notes

- **Dependencies live in a named volume** (`web_node_modules`), not in the repo
  checkout, so `npm install`/`npm ci` runs on container start from the compose
  `command:` — not during an image build. The volume persists across restarts, so
  only the first boot is slow (the healthcheck allows ~2 minutes for that).
- **Vite polls for file changes** (`server.watch.usePolling` in `vite.config.ts`).
  Bind mounts from the sandbox do not deliver native filesystem events, so HMR
  silently stops working without it. Keep polling on.
- The preview host is allowed through Vite's own allowlist by passing
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` into the service (Vite >= 6.1 appends
  it to `server.allowedHosts`). No allowlist is hardcoded in `vite.config.ts`.
- No environment variables or secrets are required — this is a frontend-only app
  with static demo data in `src/data.ts`.

## Verifying it works

- `curl -s http://localhost:3000/` should return the `index.html` shell, and the
  page should render the sidebar and stat cards.
- `docker compose -f docker-compose.base44.yml ps` — `web` must be `healthy`.
- Type check (optional): `docker compose -f docker-compose.base44.yml exec web npx tsc --noEmit`.
