-- Create a config table for platform settings
create table if not exists config (
    key text primary key,
    value text not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table config enable row level security;

-- Since we use service role to access config, no need for public policies
-- but we can add one for admin read access if needed

-- Insert the default platform markup
insert into config (key, value)
values ('platform_markup', '1.15')
on conflict (key) do nothing;
