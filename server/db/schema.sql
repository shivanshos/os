-- Idempotent: this file runs on every stack start.
create table if not exists projects (
  id text primary key,
  name text not null,
  description text not null default '',
  progress int not null default 0 check (progress between 0 and 100),
  tags text[] not null default '{}',
  owner text not null default 'MC',
  updated_at timestamptz not null default now()
);

create table if not exists activity (
  id text primary key,
  actor text not null,
  initials text not null,
  action text not null,
  target text not null,
  env text not null,
  status text not null check (status in ('Success', 'Running', 'Failed')),
  created_at timestamptz not null default now()
);

create table if not exists metrics (
  id text primary key,
  label text not null,
  value text not null,
  delta text not null,
  trend jsonb not null,
  position int not null
);
