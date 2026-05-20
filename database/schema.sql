create extension if not exists "pgcrypto";

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references options(id) on delete cascade,
  voter_id text not null,
  created_at timestamptz not null default now(),
  constraint one_vote_per_poll unique (poll_id, voter_id)
);

create index if not exists options_poll_id_idx on options(poll_id);
create index if not exists votes_poll_id_idx on votes(poll_id);
create index if not exists votes_option_id_idx on votes(option_id);

