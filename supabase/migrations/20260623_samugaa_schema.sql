create table if not exists public."User" (
  id text primary key,
  email text not null unique,
  "passwordHash" text not null,
  name text,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

create table if not exists public."Device" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  name text not null,
  platform text not null check (
    platform in ('android', 'ios', 'web', 'windows', 'macos', 'linux', 'electron')
  ),
  "pushToken" text,
  "lastSeenAt" timestamptz not null,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

create table if not exists public."Note" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  title text not null default 'Untitled',
  content text not null default '',
  "clientId" text,
  "deviceId" text references public."Device"(id) on delete set null,
  "syncVersion" integer not null default 1,
  "isDeleted" boolean not null default false,
  "deletedAt" timestamptz,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  unique ("userId", "clientId")
);

create table if not exists public."Todo" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  text text not null,
  notes text not null default '',
  done boolean not null default false,
  "doneAt" timestamptz,
  "dueDate" timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  tags text[] not null default '{}',
  "clientId" text,
  "deviceId" text references public."Device"(id) on delete set null,
  "syncVersion" integer not null default 1,
  "isDeleted" boolean not null default false,
  "deletedAt" timestamptz,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  unique ("userId", "clientId")
);

create table if not exists public."Subtask" (
  id text primary key,
  "todoId" text not null references public."Todo"(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  "sortOrder" integer not null default 0,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);

create table if not exists public."SyncLog" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  "deviceId" text references public."Device"(id) on delete set null,
  entity text not null,
  "entityId" text not null,
  action text not null,
  "createdAt" timestamptz not null
);

create index if not exists "Device_userId_lastSeenAt_idx" on public."Device" ("userId", "lastSeenAt" desc);
create index if not exists "Note_userId_updatedAt_idx" on public."Note" ("userId", "updatedAt" desc);
create index if not exists "Note_userId_isDeleted_idx" on public."Note" ("userId", "isDeleted");
create index if not exists "Todo_userId_updatedAt_idx" on public."Todo" ("userId", "updatedAt" desc);
create index if not exists "Todo_userId_isDeleted_idx" on public."Todo" ("userId", "isDeleted");
create index if not exists "Subtask_todoId_sortOrder_idx" on public."Subtask" ("todoId", "sortOrder");
create index if not exists "SyncLog_userId_createdAt_idx" on public."SyncLog" ("userId", "createdAt" desc);

notify pgrst, 'reload schema';
