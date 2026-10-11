# Base44 OS

A workspace dashboard: projects, deployments and activity in one place.

- **Stack:** React 19 + TypeScript + Vite, styled with Tailwind CSS v4
- **Views:** Overview, Projects, Activity, Settings (client-side navigation, no router)
- **Data:** static demo data in [`src/data.ts`](src/data.ts) — no backend yet

## Run it

With Docker (what the preview uses):

```bash
docker compose -f docker-compose.base44.yml up -d --build
```

Then open <http://localhost:3000>.

Or locally, if you have Node 20+:

```bash
npm install
npm run dev
```

## Project layout

```
src/
  App.tsx                 view switching + activity search
  data.ts                 demo data (stats, activity, projects)
  components/             Sidebar, TopBar, StatCard, ActivityTable,
                          ProjectGrid, SettingsPanel, icons
```
