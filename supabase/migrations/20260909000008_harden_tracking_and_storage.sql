-- =============================================================================
-- 0008 — Tighten public tracking and storage MIME types
--
-- get_order_tracking is security definer and must not be callable with the
-- public anon key. The Next.js server already looks it up with the service
-- role. SVG is removed from restaurant-assets so an XSS payload cannot be
-- hosted as a "logo".
-- =============================================================================

revoke execute on function public.get_order_tracking(text) from public, anon, authenticated;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'restaurant-assets';
