-- Update RLS policies to include superadmin access

-- Products: superadmins can manage
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins and superadmins can manage products" 
  ON public.products FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Orders: superadmins can view and update all
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Admins and superadmins can view all orders" 
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins and superadmins can update orders" 
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Events: superadmins can view all
DROP POLICY IF EXISTS "Admins can view all events" ON public.events_log;
CREATE POLICY "Admins and superadmins can view all events" 
  ON public.events_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Profiles: admins and superadmins can view all profiles
CREATE POLICY "Admins and superadmins can view all profiles" 
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));