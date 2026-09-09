-- Rename the restaurant in an already-migrated project.
-- Safe to run more than once.

update public.restaurant_settings
set
  restaurant_name = 'Hot Bread Beruwala',
  tagline = 'Freshly prepared with the finest ingredients',
  description = 'A neighbourhood kitchen in Beruwala. Freshly prepared with quality ingredients. Made with care. Served with pride.',
  seo_title = 'Hot Bread Beruwala | Order Online',
  seo_description = 'Order pickup or delivery from Hot Bread Beruwala. Freshly prepared every day.',
  address = '157/ EF Galle Rd, Beruwala',
  order_prefix = 'HBB'
where restaurant_name in ('My Restaurant', 'Spice Route Kitchen', 'Restaurant')
   or order_prefix in ('REST');
