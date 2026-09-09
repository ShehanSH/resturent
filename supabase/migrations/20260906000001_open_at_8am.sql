-- Set opening time to 8:00 AM every day of the week.
update public.restaurant_settings
set business_hours = '[
  {"day": 0, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
  {"day": 1, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
  {"day": 2, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
  {"day": 3, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
  {"day": 4, "is_open": true, "opens_at": "08:00", "closes_at": "22:00"},
  {"day": 5, "is_open": true, "opens_at": "08:00", "closes_at": "23:00"},
  {"day": 6, "is_open": true, "opens_at": "08:00", "closes_at": "23:00"}
]'::jsonb,
updated_at = now();
