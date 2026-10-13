-- Idempotent seed: existing rows are never overwritten, so edits made through
-- the API survive a stack restart.
insert into metrics (id, label, value, delta, trend, position) values
  ('projects', 'Active projects', '12', '+2 this week', '[4,6,5,8,7,10,12]', 1),
  ('deploys', 'Deployments', '148', '98% success rate', '[12,18,15,22,26,24,31]', 2),
  ('storage', 'Storage used', '68.4 GB', 'of 100 GB', '[30,34,38,41,47,55,68]', 3),
  ('team', 'Team members', '9', '+1 this month', '[5,6,6,7,8,8,9]', 4)
on conflict (id) do nothing;

insert into projects (id, name, description, progress, tags, owner, updated_at) values
  ('p1', 'web-app', 'Customer-facing dashboard with live data and dark mode.', 86, '{React,Vite}', 'MC', now() - interval '4 minutes'),
  ('p2', 'api-server', 'REST API with background jobs and webhook delivery.', 62, '{Node,Postgres}', 'SO', now() - interval '11 minutes'),
  ('p3', 'design-system', 'Shared components, tokens and documentation site.', 44, '{Tokens,a11y}', 'JW', now() - interval '32 minutes'),
  ('p4', 'docs-site', 'Public documentation with search and versioning.', 28, '{MDX,Search}', 'PN', now() - interval '1 hour')
on conflict (id) do nothing;

insert into activity (id, actor, initials, action, target, env, status, created_at) values
  ('a1', 'Maya Chen', 'MC', 'deployed', 'web-app', 'Production', 'Success', now() - interval '4 minutes'),
  ('a2', 'Deploy Bot', 'DB', 'built', 'api-server', 'Staging', 'Running', now() - interval '11 minutes'),
  ('a3', 'Jonas Weber', 'JW', 'opened a pull request in', 'design-system', 'Preview', 'Success', now() - interval '32 minutes'),
  ('a4', 'Deploy Bot', 'DB', 'failed to publish', 'docs-site', 'Production', 'Failed', now() - interval '1 hour'),
  ('a5', 'Priya Nair', 'PN', 'invited a teammate to', 'analytics', 'Workspace', 'Success', now() - interval '2 hours'),
  ('a6', 'Maya Chen', 'MC', 'rolled back', 'web-app', 'Production', 'Success', now() - interval '1 day'),
  ('a7', 'Sam Okafor', 'SO', 'connected a database to', 'api-server', 'Staging', 'Success', now() - interval '1 day 2 hours')
on conflict (id) do nothing;
