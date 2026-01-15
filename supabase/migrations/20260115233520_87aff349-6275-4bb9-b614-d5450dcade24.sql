-- Drop existing restrictive policies for payment_settings
DROP POLICY IF EXISTS "Anyone can view active payment settings" ON payment_settings;

-- Create permissive policy for viewing active payment settings
CREATE POLICY "Anyone can view active payment settings" 
ON payment_settings 
FOR SELECT 
TO authenticated
USING (is_active = true);