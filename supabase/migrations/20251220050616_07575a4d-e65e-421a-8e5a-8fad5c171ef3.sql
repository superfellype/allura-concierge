-- Create brand enum type
CREATE TYPE public.product_brand AS ENUM ('VeryRio', 'Chalita', 'LaytonVivian', 'Outro');

-- Add brand column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand public.product_brand DEFAULT 'Outro';

-- Add origin column to orders for tracking manual vs site orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS origin text DEFAULT 'site' CHECK (origin IN ('site', 'manual'));

-- Create index for brand filtering
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);

-- Create index for order origin filtering  
CREATE INDEX IF NOT EXISTS idx_orders_origin ON public.orders(origin);

-- Create function to update stock when order is created
CREATE OR REPLACE FUNCTION public.update_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrease stock for the product
  UPDATE public.products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update stock
DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_order();