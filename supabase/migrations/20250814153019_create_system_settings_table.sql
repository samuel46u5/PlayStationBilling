create table if not exists public.system_settings (
  id text primary key default 'default',
  general jsonb not null default '{}',
  printer jsonb not null default '{}',
  api jsonb not null default '{}',
  whatsapp_crm jsonb not null default '{}',
  notifications jsonb not null default '{}',
  security jsonb not null default '{}',
  backup jsonb not null default '{}',
  system jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);