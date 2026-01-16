-- Remove foreign key constraint that's blocking order updates
-- The events_log table should not have a hard FK to auth.users as
-- events can be logged by system operations without a user context
ALTER TABLE public.events_log DROP CONSTRAINT IF EXISTS events_log_user_id_fkey;