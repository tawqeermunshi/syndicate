-- Allow members to remove their own comments (RLS had insert/select only before).
drop policy if exists "authors delete own comments" on comments;

create policy "authors delete own comments"
  on comments for delete
  using (auth.uid() = author_id);
