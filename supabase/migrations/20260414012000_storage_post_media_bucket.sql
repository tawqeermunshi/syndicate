-- Native media uploads for feed posts (images/videos from device).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  2147483648, -- 2GB/object
  array['image/*', 'video/*']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'authenticated users upload post media'
  ) then
    create policy "authenticated users upload post media"
      on storage.objects for insert
      with check (
        bucket_id = 'post-media'
        and auth.uid() is not null
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'owners can delete post media'
  ) then
    create policy "owners can delete post media"
      on storage.objects for delete
      using (
        bucket_id = 'post-media'
        and owner = auth.uid()
      );
  end if;
end
$$;
