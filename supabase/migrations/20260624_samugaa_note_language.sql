alter table public."Note"
  add column if not exists language text not null default 'en'
    check (language in ('en', 'dv'));

notify pgrst, 'reload schema';
