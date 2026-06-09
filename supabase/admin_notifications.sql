create extension if not exists pgcrypto;

create table if not exists public.admin_notifications (
    id uuid primary key default gen_random_uuid(),
    event_key text not null unique,
    type text not null,
    title text not null,
    message text not null,
    user_id uuid,
    email text,
    full_name text,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_notifications_created_at_idx
    on public.admin_notifications (created_at desc);
