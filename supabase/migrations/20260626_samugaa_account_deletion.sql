alter table public."User"
  add column if not exists "deletionRequestedAt" timestamptz,
  add column if not exists "deletionStatus" text;

create table if not exists public."AccountDeletionRequest" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  email text not null,
  status text not null default 'requested',
  source text not null default 'web',
  "ipAddress" text,
  "userAgent" text,
  "requestedAt" timestamptz not null default now(),
  "adminNotifiedAt" timestamptz,
  "processedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "AccountDeletionRequest_userId_status_idx"
  on public."AccountDeletionRequest" ("userId", status);

create index if not exists "AccountDeletionRequest_requestedAt_idx"
  on public."AccountDeletionRequest" ("requestedAt");
