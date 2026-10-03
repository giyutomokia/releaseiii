create extension if not exists pgcrypto;

create table if not exists releases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists release_versions (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references releases(id) on delete cascade,
  version_number integer not null,
  package_data jsonb not null default '{}'::jsonb,
  ai_analysis jsonb,
  reviewed_internal_brief text,
  reviewed_client_brief text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  unique(release_id, version_number)
);

create table if not exists review_history (
  id uuid primary key default gen_random_uuid(),
  release_version_id uuid not null references release_versions(id) on delete cascade,
  action text not null,
  content jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_release_versions_release_id
  on release_versions(release_id);

create index if not exists idx_review_history_version_id
  on review_history(release_version_id);

-- This starter uses the Supabase service-role key only on the server.
-- Do NOT expose SUPABASE_SERVICE_ROLE_KEY to the browser.
