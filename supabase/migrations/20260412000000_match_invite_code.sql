-- Case- and padding-insensitive invite lookup for validate API (service role only).
create or replace function public.match_invite_code(p_raw text)
returns table (id uuid, used_by uuid, expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.used_by, i.expires_at
  from public.invites i
  where lower(btrim(i.code)) = lower(btrim(p_raw))
  limit 1;
$$;

revoke all on function public.match_invite_code(text) from public;
grant execute on function public.match_invite_code(text) to service_role;
