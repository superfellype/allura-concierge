-- Create sellers table for manual sales
CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Policies for sellers
CREATE POLICY "Admins and superadmins can manage sellers"
ON public.sellers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Anyone can view active sellers"
ON public.sellers
FOR SELECT
USING (is_active = true);

-- Add seller_id column to orders table
ALTER TABLE public.orders ADD COLUMN seller_id UUID REFERENCES public.sellers(id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();