-- Drop existing restrictive policy for products management
DROP POLICY IF EXISTS "Admins and superadmins can manage products" ON products;

-- Create permissive policy for admin management (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can insert products" 
ON products 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can update products" 
ON products 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can delete products" 
ON products 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Also need to allow admins to view all products (including inactive)
CREATE POLICY "Admins can view all products" 
ON products 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));