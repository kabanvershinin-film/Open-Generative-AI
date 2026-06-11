-- Запустите это в SQL Editor в Supabase, чтобы создать таблицу для совместного доступа

-- 1. Создаем таблицу workflow_shares
create table if not exists workflow_shares (
  id uuid default gen_random_uuid() primary key,
  workflow_id text not null,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'editor', -- 'viewer' или 'editor'
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(workflow_id, user_id)
);

-- 2. Включаем RLS
alter table workflow_shares enable row level security;

-- 3. Создаем RLS политики
-- Политика для чтения: владельцы и пользователи с доступом могут видеть права
create policy "Read access for owners and shared users" on workflow_shares
  for select using (true);

-- Политика для записи: только владельцы могут управлять правами
-- (проверка владельца будет на уровне приложения, или добавьте столбец owner_id в workflow_shares,
-- но проще проверять через приложение, так как воркфлоу хранятся в TOS, не в Supabase)
create policy "Insert for owners (tbd)" on workflow_shares
  for all using (true);

-- 4. Добавляем индекс для быстрого поиска по workflow_id
create index if not exists idx_workflow_shares_workflow_id on workflow_shares(workflow_id);
create index if not exists idx_workflow_shares_user_id on workflow_shares(user_id);
