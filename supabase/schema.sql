-- ============================================================
-- Nexus app — Database Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('founder', 'vc', 'operator', 'angel');
create type user_status as enum ('pending', 'approved', 'rejected', 'waitlisted');
create type post_category as enum ('building', 'raising', 'hiring', 'feedback_wanted');
create type intro_status as enum ('pending', 'accepted', 'declined');
create type event_type as enum ('dinner', 'meetup', 'conference', 'workshop', 'demo_day');
create type event_status as enum ('draft', 'published', 'cancelled', 'completed');
create type attendee_status as enum ('going', 'waitlist', 'declined');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text not null,
  avatar_url text,
  role user_role not null,
  status user_status not null default 'pending',

  -- What they've built / proof of work
  headline text,                         -- one-liner: "Building X at Y"
  bio text,
  company text,
  company_url text,
  company_stage text,                    -- pre-seed, seed, series-a, etc.
  metrics text,                          -- "400 users, $8K MRR" — self-reported
  past_work text,                        -- notable past roles/exits

  -- What they're open to
  open_to text[],                        -- ['funding', 'cofounders', 'hiring', 'advising']

  -- VC-specific
  fund_name text,
  fund_stage text[],                     -- stages they invest in
  check_size text,                       -- "$500K–$2M"
  sectors text[],                        -- sectors of interest

  -- Links
  linkedin_url text,
  twitter_url text,
  github_url text,
  website_url text,

  -- Meta
  location text,
  invited_by uuid references profiles(id),
  invite_slots integer not null default 3,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- APPLICATIONS
-- ============================================================

create table applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  email text not null,
  full_name text not null,
  role user_role not null,

  -- Application answers
  what_built text not null,              -- what have you built / invested in
  why_join text not null,                -- why do you want to join
  what_want text not null,               -- what are you looking for
  links text,                            -- portfolio / product / fund links
  vouched_by uuid references profiles(id), -- existing member co-sign

  status user_status not null default 'pending',
  reviewer_note text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INVITES
-- ============================================================

create table invites (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null default substring(md5(random()::text), 1, 10),
  created_by uuid references profiles(id) on delete cascade not null,
  used_by uuid references profiles(id),
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- POSTS (Feed)
-- ============================================================

create table posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references profiles(id) on delete cascade not null,
  category post_category not null,
  content text not null,

  -- Optional structured fields
  title text,
  link_url text,
  link_preview jsonb,                    -- {title, description, image}

  -- Visibility
  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- COMMENTS
-- ============================================================

create table comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references comments(id), -- for nested replies
  created_at timestamptz not null default now()
);

-- ============================================================
-- REACTIONS (no like counts shown publicly, but tracked)
-- ============================================================

create table reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  type text not null default 'signal',  -- 'signal' | 'watching' | 'interested'
  unique(post_id, user_id)
);

-- ============================================================
-- INTRO REQUESTS
-- ============================================================

create table intro_requests (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id uuid references profiles(id) on delete cascade not null,
  purpose text not null,                 -- "want to discuss your B2B pricing strategy"
  context text not null,                 -- why this person, why now
  proposed_duration integer default 30, -- minutes
  status intro_status not null default 'pending',
  declined_reason text,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  constraint no_self_intro check (from_user_id != to_user_id)
);

-- ============================================================
-- EVENTS
-- ============================================================

create table events (
  id uuid primary key default uuid_generate_v4(),
  organiser_id uuid references profiles(id) on delete cascade not null,

  title text not null,
  description text,
  event_type event_type not null,
  status event_status not null default 'draft',

  -- Location
  location_name text,                    -- "The Bungalow, Bandra"
  location_address text,
  city text,
  is_online boolean not null default false,
  online_link text,

  -- Time
  starts_at timestamptz not null,
  ends_at timestamptz,

  -- Capacity
  capacity integer,                      -- null = unlimited

  -- Meta
  cover_image_url text,
  tags text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- EVENT ATTENDEES
-- ============================================================

create table event_attendees (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  status attendee_status not null default 'going',
  joined_at timestamptz not null default now(),
  unique(event_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table applications enable row level security;
alter table invites enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;
alter table intro_requests enable row level security;
alter table events enable row level security;
alter table event_attendees enable row level security;

-- Helper to avoid recursive RLS checks when evaluating profile approval.
-- SECURITY DEFINER lets this check run without triggering profiles RLS again.
create or replace function public.is_profile_approved(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid
      and status = 'approved'
  );
$$;

-- Profiles: approved members see all approved profiles
create policy "approved members see profiles"
  on profiles for select
  using (
    auth.uid() = id
    or (
      status = 'approved'
      and public.is_profile_approved(auth.uid())
    )
  );

create policy "users insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "users update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Applications: anyone can insert, only owner can view their own
create policy "anyone can apply"
  on applications for insert
  with check (true);

create policy "users see own application"
  on applications for select
  using (auth.uid() = user_id);

-- Invites: members see their own invites
create policy "members manage own invites"
  on invites for all
  using (auth.uid() = created_by);

-- Posts: approved members can read/write
create policy "approved members see posts"
  on posts for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.status = 'approved'
    )
  );

create policy "approved members create posts"
  on posts for insert
  with check (
    auth.uid() = author_id and
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.status = 'approved'
    )
  );

create policy "authors update own posts"
  on posts for update
  using (auth.uid() = author_id);

create policy "authors delete own posts"
  on posts for delete
  using (auth.uid() = author_id);

-- Comments
create policy "approved members see comments"
  on comments for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

create policy "approved members create comments"
  on comments for insert
  with check (
    auth.uid() = author_id and
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

create policy "authors delete own comments"
  on comments for delete
  using (auth.uid() = author_id);

-- Reactions
create policy "approved members manage reactions"
  on reactions for all
  using (
    auth.uid() = user_id and
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

-- Intro requests: parties involved can see
create policy "parties see intro requests"
  on intro_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "approved members send intros"
  on intro_requests for insert
  with check (
    auth.uid() = from_user_id and
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

create policy "recipient updates intro status"
  on intro_requests for update
  using (auth.uid() = to_user_id);

-- Events: approved members see published events
create policy "approved members see events"
  on events for select
  using (
    status = 'published' and
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

create policy "approved members create events"
  on events for insert
  with check (
    auth.uid() = organiser_id and
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

create policy "organisers update own events"
  on events for update
  using (auth.uid() = organiser_id);

-- Event attendees
create policy "approved members see attendees"
  on event_attendees for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

create policy "approved members rsvp"
  on event_attendees for insert
  with check (
    auth.uid() = user_id and
    exists (select 1 from profiles p where p.id = auth.uid() and p.status = 'approved')
  );

create policy "users update own rsvp"
  on event_attendees for update
  using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger posts_updated_at before update on posts
  for each row execute function update_updated_at();

create trigger events_updated_at before update on events
  for each row execute function update_updated_at();

-- Decrement invite slots when an invite is used
create or replace function use_invite_slot()
returns trigger as $$
begin
  update profiles
  set invite_slots = invite_slots - 1
  where id = new.created_by and invite_slots > 0;
  return new;
end;
$$ language plpgsql;

create trigger on_invite_used
  after update of used_by on invites
  for each row
  when (old.used_by is null and new.used_by is not null)
  execute function use_invite_slot();
