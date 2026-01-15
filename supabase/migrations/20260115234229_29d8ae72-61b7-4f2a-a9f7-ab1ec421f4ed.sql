-- Drop existing restrictive policies for categories
DROP POLICY IF EXISTS "Admins and superadmins can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;

-- Create permissive policies
CREATE POLICY "Admins can manage categories" 
ON categories 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Anyone can view active categories" 
ON categories 
FOR SELECT 
TO authenticated, anon
USING (is_active = true);