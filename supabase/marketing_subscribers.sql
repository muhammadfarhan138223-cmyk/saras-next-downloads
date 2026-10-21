-- Applied to the user's existing SARAS Supabase project as a separate table.
-- Never expose the service-role key to browser JavaScript.
create table if not exists public.marketing_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  consented_at timestamptz not null default now(),
  consent_version text not null default '2026-10-20-v1',
  status text not null default 'active' check (status in ('active', 'unsubscribed')),
  subscription_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_subscribers_email_length check (char_length(email) between 3 and 320)
);
create unique index if not exists marketing_subscribers_email_lower_uidx on public.marketing_subscribers (lower(email));
create unique index if not exists marketing_subscribers_email_uidx on public.marketing_subscribers (email);
alter table public.marketing_subscribers enable row level security;
revoke all on table public.marketing_subscribers from anon, authenticated;
grant all on table public.marketing_subscribers to service_role;
