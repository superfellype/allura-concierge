-- Remove foreign key constraint from orders.user_id to auth.users
-- This allows manual orders to use profile user_ids that don't exist in auth.users

ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Add comment explaining the change
COMMENT ON COLUMN public.orders.user_id IS 'User ID - can reference auth.users for authenticated users or a generated UUID for manual customers';