create table if not exists public."PasswordResetToken" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  "tokenHash" text not null unique,
  "expiresAt" timestamptz not null,
  "usedAt" timestamptz,
  "createdAt" timestamptz not null
);

create index if not exists "PasswordResetToken_userId_createdAt_idx"
  on public."PasswordResetToken" ("userId", "createdAt" desc);

create index if not exists "PasswordResetToken_expiresAt_idx"
  on public."PasswordResetToken" ("expiresAt");

notify pgrst, 'reload schema';
