-- Shop location is 157/ EF Galle Rd, Beruwala — not Colombo.
update public.restaurant_settings
set address = '157/ EF Galle Rd, Beruwala'
where is_singleton = true;
