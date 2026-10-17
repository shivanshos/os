# Base44 OS

A workspace dashboard for managing projects, deployments and activity.

- **Frontend:** React 19 + TypeScript + Vite, styled with Tailwind CSS v4 (`src/`)
- **Backend:** Node.js + Express REST API (`server/`)
- **Database:** Postgres 16 — the workspace data (projects, activity, metrics) lives here
- **Views:** Overview, Projects, Activity, Settings

The browser talks to one origin: Vite dev-proxies `/api` to the API, so no CORS
setup is needed.

## Run it

With Docker (what the preview uses):

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

Open <http://localhost:3000>. Postgres, the API and the frontend all start
together; schema and seed data are applied on every start and are idempotent.

## API

| method | route                  | purpose                                       |
| ------ | ---------------------- | --------------------------------------------- |
| GET    | `/api/health`          | liveness + database check                      |
| GET    | `/api/stats`           | metric cards                                   |
| GET    | `/api/activity`        | activity feed (`?q=` to search)                 |
| POST   | `/api/activity`        | record an event                                |
| GET    | `/api/projects`        | list projects                                  |
| POST   | `/api/projects`        | create a project (also logged to the feed)      |
| PATCH  | `/api/projects/:id`    | update name, description, tags or progress      |
| DELETE | `/api/projects/:id`    | delete a project                               |

The API is also reachable directly on port 4000.

## Project layout

```
src/                      React frontend
  App.tsx                 loads data from the API, view switching, activity search
  api.ts / types.ts       typed API client
  components/             Sidebar, TopBar, StatCard, ActivityTable,
                          ProjectGrid, NewProjectForm, SettingsPanel, icons
server/                   Express backend
  src/index.js            app entry, /api/health, route mounting
  src/routes/             projects, activity, stats routers
  src/db.js               Postgres pool
  db/schema.sql           tables (idempotent)
  db/seed.sql             demo rows (idempotent)
```

## Running the frontend locally without Docker

```bash
npm install && npm run dev            # http://localhost:5173
cd server && npm install && npm run dev   # http://localhost:4000
```

Set `API_PROXY_TARGET` if the API is not on `http://localhost:4000`, and
`DATABASE_URL` (defaults to `postgres://base44:base44_dev@localhost:5432/base44`).
