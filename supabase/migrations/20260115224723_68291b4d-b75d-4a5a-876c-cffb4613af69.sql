-- Create table for payment method settings
CREATE TABLE public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  method_id text NOT NULL UNIQUE,
  method_label text NOT NULL,
  icon text DEFAULT '💳',
  is_active boolean DEFAULT true,
  installments jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active payment settings
CREATE POLICY "Anyone can view active payment settings"
ON public.payment_settings
FOR SELECT
USING (is_active = true);

-- Admins and superadmins can manage payment settings
CREATE POLICY "Admins and superadmins can manage payment settings"
ON public.payment_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Insert default payment methods
INSERT INTO public.payment_settings (method_id, method_label, icon, installments, display_order) VALUES
('pix', 'PIX', '💳', '[{"qty": 1, "tax": 0, "label": "À vista"}]'::jsonb, 1),
('credit_card', 'Cartão de Crédito', '💳', '[
  {"qty": 1, "tax": 2.5, "label": "À vista"},
  {"qty": 2, "tax": 3.5, "label": "2x"},
  {"qty": 3, "tax": 4.0, "label": "3x"},
  {"qty": 4, "tax": 4.5, "label": "4x"},
  {"qty": 5, "tax": 5.0, "label": "5x"},
  {"qty": 6, "tax": 5.5, "label": "6x"},
  {"qty": 7, "tax": 6.0, "label": "7x"},
  {"qty": 8, "tax": 6.5, "label": "8x"},
  {"qty": 9, "tax": 7.0, "label": "9x"},
  {"qty": 10, "tax": 7.5, "label": "10x"},
  {"qty": 11, "tax": 8.0, "label": "11x"},
  {"qty": 12, "tax": 8.5, "label": "12x"}
]'::jsonb, 2),
('debit_card', 'Cartão de Débito', '💳', '[{"qty": 1, "tax": 1.5, "label": "À vista"}]'::jsonb, 3),
('cash', 'Dinheiro', '💵', '[{"qty": 1, "tax": 0, "label": "À vista"}]'::jsonb, 4),
('payment_link', 'Link de Pagamento', '🔗', '[
  {"qty": 1, "tax": 3.0, "label": "À vista"},
  {"qty": 2, "tax": 4.0, "label": "2x"},
  {"qty": 3, "tax": 4.5, "label": "3x"},
  {"qty": 4, "tax": 5.0, "label": "4x"},
  {"qty": 5, "tax": 5.5, "label": "5x"},
  {"qty": 6, "tax": 6.0, "label": "6x"}
]'::jsonb, 5);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();