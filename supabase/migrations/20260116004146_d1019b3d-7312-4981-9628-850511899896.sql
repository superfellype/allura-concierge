-- Fix manual customer creation: profiles.user_id must not require an auth user
-- The profiles table should not have a foreign key to auth users (manual customers don't have logins)

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Ensure user_id remains required
ALTER TABLE public.profiles
  ALTER COLUMN user_id SET NOT NULL;

-- Optional: keep one profile per user_id (works for both authenticated + manual customers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_key'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;