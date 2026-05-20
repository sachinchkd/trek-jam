# Dhorpatan Jam Polls

A quick poll-and-vote-only web app for **Dhorpatan Jam**.

## Features

- Public voting page
- Multiple active polls
- Admin page for creating polls
- One vote per poll per browser/device using a stored voter ID
- Live vote totals after voting
- Supabase database
- Deployable on Vercel or any Node/Next.js host

## 1. Create the database

Create a Supabase project, open the SQL editor, and run:

```sql
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
```

The same SQL is saved in `database/schema.sql`.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Fill in:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_SECRET=make-a-strong-admin-password
```

Important: keep `SUPABASE_SERVICE_ROLE_KEY` secret. Do not put it in frontend code.

## 3. Run locally

```bash
npm install
npm run dev
```

Open:

- Voting page: `http://localhost:3000`
- Admin page: `http://localhost:3000/admin`

## 4. Deploy

The easiest path is Vercel:

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Add the same environment variables in Vercel project settings.
4. Deploy.

## Notes

This is a quick MVP. The one-vote rule is enforced by a browser-stored voter ID and a database uniqueness rule. It prevents normal duplicate voting, but it is not as strong as login-based voting.

For stricter voting, add phone/email login or event ticket-code voting.
