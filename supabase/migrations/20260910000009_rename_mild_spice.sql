-- Rename the default spice option from "Mild" to "Light spice".
update public.options o
set name = 'Light spice'
from public.option_groups g
where o.option_group_id = g.id
  and g.name = 'Spice level'
  and o.name = 'Mild';
