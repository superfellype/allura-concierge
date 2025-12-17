import { supabase } from "@/integrations/supabase/client";

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  provider_reference: string | null;
  status: string;
  amount: number;
  method: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface CreatePaymentInput {
  order_id: string;
  provider?: string;
  provider_reference?: string;
  amount: number;
  method?: string;
  metadata?: Record<string, any>;
}

class PaymentsService {
  async getByOrderId(orderId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    return { data: data as Payment[] | null, error };
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    return { data: data as Payment | null, error };
  }

  async create(input: CreatePaymentInput) {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        order_id: input.order_id,
        provider: input.provider || 'infinitepay',
        provider_reference: input.provider_reference,
        amount: input.amount,
        method: input.method,
        metadata: input.metadata || {},
        status: 'pending'
      }])
      .select()
      .single();

    return { data: data as Payment | null, error };
  }

  async updateStatus(id: string, status: PaymentStatus, metadata?: Record<string, any>) {
    const updateData: any = { status };
    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return { data: data as Payment | null, error };
  }

  async markAsPaid(id: string, providerReference?: string) {
    const updateData: any = { 
      status: 'paid' as PaymentStatus
    };
    
    if (providerReference) {
      updateData.provider_reference = providerReference;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return { data: data as Payment | null, error };
  }

  async getAll(limit: number = 50) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        orders (
          id,
          user_id,
          status,
          total
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  }

  async getByStatus(status: PaymentStatus) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    return { data: data as Payment[] | null, error };
  }

  // Estatísticas para dashboard
  async getStats() {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('status, amount');

    if (error || !payments) {
      return { data: null, error };
    }

    const stats = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      paid: payments.filter(p => p.status === 'paid').length,
      paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
      pending: payments.filter(p => p.status === 'pending').length,
      failed: payments.filter(p => p.status === 'failed').length
    };

    return { data: stats, error: null };
  }
}

export const paymentsService = new PaymentsService();
