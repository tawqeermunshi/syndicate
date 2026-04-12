-- Allow marking an invite used as soon as the auth user exists (before profile row).
alter table public.invites drop constraint if exists invites_used_by_fkey;
alter table public.invites
  add constraint invites_used_by_fkey
  foreign key (used_by) references auth.users (id) on delete set null;

-- One-time email codes for invite email/password sign-up (service role only).
create table if not exists public.join_email_otp (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists join_email_otp_email_created_idx
  on public.join_email_otp (lower(email), created_at desc);

alter table public.join_email_otp enable row level security;
