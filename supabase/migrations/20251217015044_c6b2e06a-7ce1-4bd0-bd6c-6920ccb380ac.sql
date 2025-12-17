-- ================================
-- 1. ALTERAÇÕES NA TABELA PRODUCTS
-- ================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS height_cm DECIMAL(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS width_cm DECIMAL(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS length_cm DECIMAL(6,2) DEFAULT 0;

-- Índice para SKU
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;

-- ================================
-- 2. TABELA CATEGORIES
-- ================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and superadmins can manage categories"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_categories_order ON public.categories(display_order);

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================
-- 3. TABELA PRODUCT_CATEGORIES (Junction)
-- ================================

CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product categories"
  ON public.product_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins and superadmins can manage product categories"
  ON public.product_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- ================================
-- 4. TABELA COLLECTIONS
-- ================================

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  editorial_description TEXT,
  cover_image_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  highlight_on_home BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active collections"
  ON public.collections FOR SELECT
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Admins and superadmins can manage collections"
  ON public.collections FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE INDEX idx_collections_slug ON public.collections(slug);
CREATE INDEX idx_collections_highlight ON public.collections(highlight_on_home) WHERE highlight_on_home = true;

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================
-- 5. TABELA PRODUCT_COLLECTIONS (Junction)
-- ================================

CREATE TABLE IF NOT EXISTS public.product_collections (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (product_id, collection_id)
);

ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product collections"
  ON public.product_collections FOR SELECT
  USING (true);

CREATE POLICY "Admins and superadmins can manage product collections"
  ON public.product_collections FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- ================================
-- 6. TABELA PAYMENTS
-- ================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'infinitepay',
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  method TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and superadmins can view all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================
-- 7. ALTERAR ORDERS - Adicionar discount_total e coupon_id
-- ================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_total DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id);

-- ================================
-- 8. REALTIME
-- ================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;