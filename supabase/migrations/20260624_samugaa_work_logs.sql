create table if not exists public."WorkLog" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  task text not null default '',
  notes text not null default '',
  "createdAt" timestamptz not null,
  tags text[] not null default '{}',
  "photoPath" text,
  "linkedTodoId" text,
  "todoStatusHistory" jsonb not null default '[]'::jsonb,
  "enrichNote" text,
  "clientId" text,
  "deviceId" text references public."Device"(id) on delete set null,
  "syncVersion" integer not null default 1,
  "isDeleted" boolean not null default false,
  "deletedAt" timestamptz,
  "updatedAt" timestamptz not null,
  unique ("userId", "clientId")
);

create index if not exists "WorkLog_userId_updatedAt_idx" on public."WorkLog" ("userId", "updatedAt" desc);
create index if not exists "WorkLog_userId_isDeleted_idx" on public."WorkLog" ("userId", "isDeleted");
create index if not exists "WorkLog_userId_createdAt_idx" on public."WorkLog" ("userId", "createdAt" desc);
create index if not exists "WorkLog_userId_linkedTodoId_idx" on public."WorkLog" ("userId", "linkedTodoId");

notify pgrst, 'reload schema';
