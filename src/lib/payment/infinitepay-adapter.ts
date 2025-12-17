// InfinitePay Adapter - Following Adapter Pattern
// Core system doesn't know InfinitePay exists

export interface PaymentItem {
  name: string;
  quantity: number;
  price: number; // em reais (R$)
}

export interface CheckoutConfig {
  handle: string;
  items: PaymentItem[];
  order_nsu?: string;
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
    // Build items array in InfinitePay format
    const items = config.items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    // Build URL manually without heavy encoding (InfinitePay expects minimal encoding)
    const itemsJson = JSON.stringify(items);
    const redirectUrl = encodeURIComponent(config.redirect_url);
    
    return `${this.baseUrl}/${this.handle}?items=${itemsJson}&redirect_url=${redirectUrl}`;
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

// Helper to format price display
export const formatPrice = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
