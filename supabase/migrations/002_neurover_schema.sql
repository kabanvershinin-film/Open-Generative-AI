-- ============================================================
-- Neurover schema: plans, subscriptions, credits, workflows,
-- generations, media, ai_models, providers, tickets, cms, logs
-- ============================================================

-- Plans
create table if not exists plans (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,          -- basic | extended | studio
    name text not null,
    price_rub integer not null,         -- kopecks
    credits integer not null,
    duration_days integer not null default 30,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz default now()
);

insert into plans (code, name, price_rub, credits, duration_days, sort_order) values
    ('basic',    'Базовая',     100000, 2000,  30, 1),
    ('extended', 'Расширенная', 300000, 6000,  30, 2),
    ('studio',   'Студийная',   500000, 10000, 30, 3)
on conflict (code) do nothing;

-- User subscriptions
create table if not exists user_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    plan_id uuid not null references plans(id),
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    status text not null default 'active', -- active | expired | cancelled
    created_at timestamptz default now(),
    unique (user_id)
);
alter table user_subscriptions enable row level security;
create policy "users see own sub" on user_subscriptions for select using (auth.uid() = user_id);

-- Credits ledger (immutable rows, never update/delete)
create table if not exists credit_ledger (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    type text not null,         -- credit | charge | reserve | capture | refund
    amount numeric not null,
    description text not null default '',
    generation_id uuid,
    created_at timestamptz default now()
);
alter table credit_ledger enable row level security;
create policy "users see own ledger" on credit_ledger for select using (auth.uid() = user_id);

-- AI Models catalog (admin-managed)
create table if not exists ai_models (
    id uuid primary key default gen_random_uuid(),
    key text unique not null,
    name text not null,
    provider_key text not null,
    media_type text not null,       -- text | image | video | audio
    operation text not null,        -- image_generate | video_generate | chat | speech_synthesize | ...
    execution_mode text not null default 'sync_result', -- streaming_text | sync_result | async_task
    credits_per_unit numeric not null default 1,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    description text not null default '',
    config jsonb not null default '{}',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

insert into ai_models (key, name, provider_key, media_type, operation, credits_per_unit) values
    ('fake.image',                  'Demo Image',          'fake',     'image', 'image_generate',   7.5),
    ('fake.video',                  'Demo Video',          'fake',     'video', 'video_generate',  50),
    ('fake.text',                   'Demo Text',           'fake',     'text',  'chat',              1),
    ('fake.audio',                  'Demo Audio',          'fake',     'audio', 'speech_synthesize', 5),
    ('modelark.seedream_image',     'Seedream 5.0 Pro',    'modelark', 'image', 'image_generate',   7.5),
    ('modelark.seedance_2_video',   'Seedance 2.0 Pro',    'modelark', 'video', 'video_generate', 145),
    ('modelark.doubao_seed_text',   'Doubao Seed',         'modelark', 'text',  'chat',              2),
    ('elspy.text',                  'Elspy Text',          'elspy',    'text',  'chat',              1.5),
    ('tokengo.text',                'TokenGo Text',        'tokengo',  'text',  'chat',              1),
    ('sdas.video',                  'SDAS Video',          'sdas',     'video', 'video_generate',   80)
on conflict (key) do nothing;

-- Providers
create table if not exists providers (
    id uuid primary key default gen_random_uuid(),
    key text unique not null,
    name text not null,
    status text not null default 'active',
    has_api_key boolean not null default false,
    created_at timestamptz default now()
);

insert into providers (key, name) values
    ('fake',     'Demo (Fake)'),
    ('modelark', 'ModelArk / VolcEngine'),
    ('sdas',     'SDAS Video'),
    ('elspy',    'Elspy'),
    ('tokengo',  'TokenGo')
on conflict (key) do nothing;

-- Workflows (projects)
create table if not exists workflows (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    name text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
alter table workflows enable row level security;
create policy "users see own workflows" on workflows for all using (auth.uid() = user_id);

-- Workflow nodes
create table if not exists workflow_nodes (
    id uuid primary key default gen_random_uuid(),
    workflow_id uuid not null references workflows(id) on delete cascade,
    name text not null,
    slug text not null,
    type text not null,         -- image | video | audio | text
    model_key text,
    params jsonb not null default '{}',
    pos_x numeric not null default 0,
    pos_y numeric not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
alter table workflow_nodes enable row level security;
create policy "users see own nodes" on workflow_nodes for all using (
    exists (select 1 from workflows w where w.id = workflow_id and w.user_id = auth.uid())
);

-- Generations
create table if not exists generations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    node_id uuid references workflow_nodes(id) on delete set null,
    workflow_id uuid references workflows(id) on delete set null,
    model_key text not null,
    prompt text not null default '',
    params jsonb not null default '{}',
    status text not null default 'pending', -- pending | running | success | failed
    credits_cost numeric not null default 0,
    output_url text,
    error_msg text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
alter table generations enable row level security;
create policy "users see own generations" on generations for all using (auth.uid() = user_id);

-- Media files
create table if not exists media_files (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    type text not null,         -- image | video | audio
    filename text not null,
    mime_type text not null,
    size_bytes integer not null default 0,
    url text not null,
    created_at timestamptz default now()
);
alter table media_files enable row level security;
create policy "users see own media" on media_files for all using (auth.uid() = user_id);

-- Support tickets
create table if not exists tickets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    title text not null,
    body text not null,
    status text not null default 'open',   -- open | pending | closed
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
alter table tickets enable row level security;
create policy "users see own tickets" on tickets for all using (auth.uid() = user_id);

-- Ticket replies
create table if not exists ticket_replies (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references tickets(id) on delete cascade,
    user_id uuid not null references profiles(id) on delete cascade,
    body text not null,
    is_admin boolean not null default false,
    created_at timestamptz default now()
);
alter table ticket_replies enable row level security;
create policy "users see replies to own tickets" on ticket_replies for select using (
    exists (select 1 from tickets t where t.id = ticket_id and t.user_id = auth.uid())
);

-- CMS Pages
create table if not exists cms_pages (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    title text not null,
    content text not null default '',
    is_published boolean not null default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Site settings
create table if not exists site_settings (
    key text primary key,
    value text not null,
    updated_at timestamptz default now()
);

insert into site_settings (key, value) values
    ('allow_registration', 'true'),
    ('allow_google',       'false'),
    ('allow_telegram',     'false'),
    ('site_name',          'AI Studio'),
    ('storage_upload_gb',  '3'),
    ('storage_gen_gb',     '5')
on conflict (key) do nothing;

-- Activity log
create table if not exists activity_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete set null,
    action text not null,
    details jsonb not null default '{}',
    ip text not null default '',
    created_at timestamptz default now()
);

-- Author nodes (workflow template nodes)
create table if not exists author_nodes (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text not null default '',
    type text not null,
    config jsonb not null default '{}',
    is_active boolean not null default true,
    created_at timestamptz default now()
);

-- Partners
create table if not exists partners (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    status text not null default 'active',
    commission_pct numeric not null default 0,
    created_at timestamptz default now()
);

-- Partner programs
create table if not exists partner_programs (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text not null default '',
    commission_pct numeric not null default 0,
    is_active boolean not null default true,
    created_at timestamptz default now()
);

-- Access blocks (IP/email bans)
create table if not exists access_blocks (
    id uuid primary key default gen_random_uuid(),
    type text not null,         -- ip | email | user
    value text not null,
    reason text not null default '',
    created_at timestamptz default now()
);

-- Notifications (broadcast)
create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    body text not null,
    type text not null default 'info',   -- info | warning | error
    is_active boolean not null default true,
    created_at timestamptz default now()
);

-- VPN entries
create table if not exists vpn_entries (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    host text not null,
    status text not null default 'active',
    created_at timestamptz default now()
);

-- Database backup log
create table if not exists backup_logs (
    id uuid primary key default gen_random_uuid(),
    status text not null,
    size_bytes bigint,
    duration_ms integer,
    error_msg text,
    created_at timestamptz default now()
);

-- Service registry (Go microservices)
create table if not exists services (
    id uuid primary key default gen_random_uuid(),
    key text unique not null,
    name text not null,
    host text not null,
    status text not null default 'active',
    last_ping timestamptz
);

insert into services (key, name, host, status) values
    ('volcengine', 'VolcEngine / ModelArk', 'volcengine-service:8080', 'active'),
    ('sdas',       'SDAS Video',            'sdas-service:8081',       'active'),
    ('elspy',      'Elspy',                 'elspy-service:8082',      'active'),
    ('tokengo',    'TokenGo',               'tokengo-service:8083',    'active')
on conflict (key) do nothing;
