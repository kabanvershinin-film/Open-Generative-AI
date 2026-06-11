alter table public.profiles
    alter column email drop not null;

alter table public.profiles
    add column if not exists phone text;
