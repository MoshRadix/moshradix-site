alter table public."User"
  add column if not exists "emailVerifiedAt" timestamptz,
  add column if not exists "verificationExpiresAt" timestamptz;

update public."User"
set "emailVerifiedAt" = coalesce("createdAt", now()),
    "verificationExpiresAt" = null
where "emailVerifiedAt" is null
  and "verificationExpiresAt" is null;

create table if not exists public."EmailVerificationToken" (
  id text primary key,
  "userId" text not null references public."User"(id) on delete cascade,
  "tokenHash" text not null unique,
  "expiresAt" timestamptz not null,
  "usedAt" timestamptz,
  "createdAt" timestamptz not null
);

create index if not exists "User_emailVerifiedAt_verificationExpiresAt_idx"
  on public."User" ("emailVerifiedAt", "verificationExpiresAt");

create index if not exists "EmailVerificationToken_userId_createdAt_idx"
  on public."EmailVerificationToken" ("userId", "createdAt" desc);

notify pgrst, 'reload schema';
