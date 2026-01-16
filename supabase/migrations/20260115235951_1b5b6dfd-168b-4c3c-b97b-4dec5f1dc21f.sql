-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Admins can manage brands
CREATE POLICY "Admins can manage brands"
ON public.brands
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Anyone can view active brands
CREATE POLICY "Anyone can view active brands"
ON public.brands
FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Insert default brands from existing enum
INSERT INTO public.brands (name, slug, display_order) VALUES
('VeryRio', 'veryrio', 1),
('Chalita', 'chalita', 2),
('Layton Vivian', 'laytonvivian', 3);

-- Add trigger for updated_at
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create theme_drafts table for the theme editor
CREATE TABLE public.theme_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  theme_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_drafts ENABLE ROW LEVEL SECURITY;

-- Admins can manage theme drafts
CREATE POLICY "Admins can manage theme drafts"
ON public.theme_drafts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_theme_drafts_updated_at
BEFORE UPDATE ON public.theme_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();