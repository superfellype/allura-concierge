-- Allow users to update their own orders (limited to status changes for pending orders)
CREATE POLICY "Users can update own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id AND status IN ('created', 'pending_payment'))
WITH CHECK (auth.uid() = user_id);