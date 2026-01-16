-- Allow admins and superadmins to create profiles for manual customers
CREATE POLICY "Admins can create profiles for manual customers"
ON public.profiles
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Allow admins to update any profile (for managing manual customers)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);