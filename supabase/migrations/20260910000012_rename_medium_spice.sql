-- Rename the default medium spice option to include the word "spice".
update public.options o
set name = 'Medium spice'
from public.option_groups g
where o.option_group_id = g.id
  and g.name = 'Spice level'
  and o.name = 'Medium';
