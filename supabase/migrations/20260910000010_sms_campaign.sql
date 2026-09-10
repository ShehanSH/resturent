-- Marketing SMS uses the existing sms_logs table with a new event type.
alter type public.sms_event_type add value if not exists 'CAMPAIGN';
