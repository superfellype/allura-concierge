// InfinitePay Adapter - Following Adapter Pattern
// Core system doesn't know InfinitePay exists

export interface PaymentItem {
  name: string;
  quantity: number;
  unit_price: number; // em centavos
}

export interface CheckoutConfig {
  handle: string;
  items: PaymentItem[];
  order_nsu: string;
  redirect_url: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface IPaymentGateway {
  createCheckoutLink(config: CheckoutConfig): string;
  parseRedirectParams(params: URLSearchParams): { transactionId: string; status: string };
}

class InfinitePayAdapter implements IPaymentGateway {
  private baseUrl = 'https://checkout.infinitepay.io';
  private handle: string;

  constructor(handle: string) {
    this.handle = handle;
  }

  createCheckoutLink(config: CheckoutConfig): string {
    const params = new URLSearchParams();
    
    // Encode items as JSON
    params.set('items', JSON.stringify(config.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price
    }))));
    
    // Order reference
    params.set('order_nsu', config.order_nsu);
    
    // Redirect after payment
    params.set('redirect_url', config.redirect_url);
    
    // Customer info (optional)
    if (config.customer_name) params.set('customer_name', config.customer_name);
    if (config.customer_email) params.set('customer_email', config.customer_email);
    if (config.customer_phone) params.set('customer_phone', config.customer_phone);

    return `${this.baseUrl}/${this.handle}?${params.toString()}`;
  }

  parseRedirectParams(params: URLSearchParams): { transactionId: string; status: string } {
    return {
      transactionId: params.get('transaction_id') || params.get('order_nsu') || '',
      status: params.get('status') || 'pending'
    };
  }
}

// Factory function - abstracts the specific implementation
export const createPaymentGateway = (handle: string): IPaymentGateway => {
  return new InfinitePayAdapter(handle);
};

// Helper to format price from BRL to centavos
export const formatToCentavos = (value: number): number => Math.round(value * 100);

// Helper to format price display
export const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
