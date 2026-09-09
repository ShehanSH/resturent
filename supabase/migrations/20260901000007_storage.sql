-- =============================================================================
-- 0007 — Supabase Storage buckets and access policies
--
-- Menu imagery is world readable (it is displayed on the public site) but only
-- an authenticated ADMIN may upload, replace or remove a file. Size and MIME
-- type are constrained at the bucket level so a rejected upload never reaches
-- application code.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('restaurant-assets', 'restaurant-assets', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']),
  ('category-images', 'category-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('food-images', 'food-images', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Menu media is publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('restaurant-assets', 'category-images', 'food-images'));

create policy "Admins can upload menu media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('restaurant-assets', 'category-images', 'food-images')
    and public.is_admin()
  );

create policy "Admins can replace menu media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('restaurant-assets', 'category-images', 'food-images')
    and public.is_admin()
  )
  with check (
    bucket_id in ('restaurant-assets', 'category-images', 'food-images')
    and public.is_admin()
  );

create policy "Admins can delete menu media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('restaurant-assets', 'category-images', 'food-images')
    and public.is_admin()
  );
