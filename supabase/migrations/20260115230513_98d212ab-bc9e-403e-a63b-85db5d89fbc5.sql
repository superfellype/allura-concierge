-- Create site_settings table for full site customization
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  setting_group text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view site settings (needed for frontend)
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Only admins and superadmins can manage settings
CREATE POLICY "Admins and superadmins can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for all customizable areas

-- IDENTITY / BRANDING
INSERT INTO public.site_settings (setting_key, setting_group, setting_value) VALUES
('brand_name', 'identity', '{"value": "Allura"}'::jsonb),
('brand_tagline', 'identity', '{"value": "Elegância em cada detalhe"}'::jsonb),
('logo_url', 'identity', '{"value": ""}'::jsonb),
('logo_text_url', 'identity', '{"value": ""}'::jsonb),
('favicon_url', 'identity', '{"value": ""}'::jsonb),
('primary_color', 'identity', '{"value": "#d97706"}'::jsonb),
('accent_color', 'identity', '{"value": "#fbbf24"}'::jsonb);

-- HOME PAGE
INSERT INTO public.site_settings (setting_key, setting_group, setting_value) VALUES
('hero_title', 'home', '{"value": "Descubra Nossa Coleção"}'::jsonb),
('hero_subtitle', 'home', '{"value": "Peças exclusivas que transformam seu estilo"}'::jsonb),
('hero_image_url', 'home', '{"value": ""}'::jsonb),
('hero_cta_text', 'home', '{"value": "Ver Coleção"}'::jsonb),
('hero_cta_link', 'home', '{"value": "/produtos"}'::jsonb),
('benefits_enabled', 'home', '{"value": true}'::jsonb),
('benefits', 'home', '{"value": [{"icon": "Truck", "title": "Frete Grátis", "description": "Acima de R$ 299"}, {"icon": "CreditCard", "title": "Parcelamos", "description": "Em até 12x"}, {"icon": "Shield", "title": "Compra Segura", "description": "Ambiente protegido"}]}'::jsonb),
('featured_products_title', 'home', '{"value": "Destaques"}'::jsonb),
('featured_products_limit', 'home', '{"value": 8}'::jsonb);

-- CONTACT INFO
INSERT INTO public.site_settings (setting_key, setting_group, setting_value) VALUES
('store_phone', 'contact', '{"value": ""}'::jsonb),
('store_whatsapp', 'contact', '{"value": ""}'::jsonb),
('store_email', 'contact', '{"value": ""}'::jsonb),
('store_address', 'contact', '{"value": ""}'::jsonb),
('store_city', 'contact', '{"value": ""}'::jsonb),
('store_state', 'contact', '{"value": ""}'::jsonb),
('store_zip', 'contact', '{"value": ""}'::jsonb);

-- SOCIAL MEDIA
INSERT INTO public.site_settings (setting_key, setting_group, setting_value) VALUES
('social_instagram', 'social', '{"value": ""}'::jsonb),
('social_facebook', 'social', '{"value": ""}'::jsonb),
('social_tiktok', 'social', '{"value": ""}'::jsonb),
('social_youtube', 'social', '{"value": ""}'::jsonb),
('social_pinterest', 'social', '{"value": ""}'::jsonb);

-- FOOTER
INSERT INTO public.site_settings (setting_key, setting_group, setting_value) VALUES
('footer_about_text', 'footer', '{"value": "Moda feminina com elegância e sofisticação."}'::jsonb),
('footer_copyright', 'footer', '{"value": "© 2024 Allura. Todos os direitos reservados."}'::jsonb),
('footer_links', 'footer', '{"value": [{"label": "Sobre Nós", "url": "/sobre"}, {"label": "Política de Trocas", "url": "/politica-trocas"}, {"label": "Política de Privacidade", "url": "/politica-privacidade"}]}'::jsonb);

-- INSTITUTIONAL PAGES
INSERT INTO public.site_settings (setting_key, setting_group, setting_value) VALUES
('page_about_title', 'pages', '{"value": "Sobre Nós"}'::jsonb),
('page_about_content', 'pages', '{"value": ""}'::jsonb),
('page_exchange_title', 'pages', '{"value": "Política de Trocas e Devoluções"}'::jsonb),
('page_exchange_content', 'pages', '{"value": ""}'::jsonb),
('page_privacy_title', 'pages', '{"value": "Política de Privacidade"}'::jsonb),
('page_privacy_content', 'pages', '{"value": ""}'::jsonb),
('page_terms_title', 'pages', '{"value": "Termos de Uso"}'::jsonb),
('page_terms_content', 'pages', '{"value": ""}'::jsonb);

-- SEO
INSERT INTO public.site_settings (setting_key, setting_group, setting_value) VALUES
('seo_title', 'seo', '{"value": "Allura | Moda Feminina"}'::jsonb),
('seo_description', 'seo', '{"value": "Loja de moda feminina com peças exclusivas e elegantes."}'::jsonb),
('seo_keywords', 'seo', '{"value": "moda feminina, roupas, acessórios, elegância"}'::jsonb),
('seo_og_image', 'seo', '{"value": ""}'::jsonb);

-- ECOMMERCE SETTINGS
INSERT INTO public.site_settings (setting_key, setting_group, setting_value) VALUES
('currency', 'ecommerce', '{"value": "BRL"}'::jsonb),
('currency_symbol', 'ecommerce', '{"value": "R$"}'::jsonb),
('free_shipping_threshold', 'ecommerce', '{"value": 299}'::jsonb),
('min_order_value', 'ecommerce', '{"value": 0}'::jsonb),
('max_installments', 'ecommerce', '{"value": 12}'::jsonb),
('installment_min_value', 'ecommerce', '{"value": 50}'::jsonb),
('show_stock_quantity', 'ecommerce', '{"value": false}'::jsonb),
('low_stock_message', 'ecommerce', '{"value": "Poucas unidades disponíveis"}'::jsonb);