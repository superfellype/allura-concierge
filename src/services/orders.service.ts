import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: Json;
  payment_method: string | null;
  payment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  attributes: Json | null;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { product?: { name: string; images: string[] | null } })[];
  profile?: { full_name: string | null; phone: string | null };
}

export interface CreateOrderInput {
  user_id: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: Json;
  payment_method?: string;
  notes?: string;
}

export interface CreateOrderItemInput {
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  attributes?: Json | null;
}

class OrdersService {
  async getAll(): Promise<{ data: Order[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    return { data: data as Order[] | null, error };
  }

  async getAllWithProfiles(): Promise<{ data: (Order & { profile?: { full_name: string | null } })[] | null; error: Error | null }> {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !orders) {
      return { data: null, error };
    }

    // Fetch profiles separately
    const userIds = [...new Set(orders.map(o => o.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    return {
      data: orders.map(order => ({
        ...order,
        profile: profileMap.get(order.user_id) as { full_name: string | null } | undefined
      })) as (Order & { profile?: { full_name: string | null } })[],
      error: null
    };
  }

  async getByUser(userId: string): Promise<{ data: Order[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { data: data as Order[] | null, error };
  }

  async getById(id: string): Promise<{ data: OrderWithItems | null; error: Error | null }> {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return { data: null, error: orderError };
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        *,
        products (name, images)
      `)
      .eq("order_id", id);

    if (itemsError) {
      return { data: null, error: itemsError };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", order.user_id)
      .maybeSingle();

    return {
      data: {
        ...order,
        items: items?.map(item => ({
          ...item,
          product: (item as any).products as { name: string; images: string[] | null } | undefined
        })) || [],
        profile: profile || undefined
      } as OrderWithItems,
      error: null
    };
  }

  async create(input: CreateOrderInput): Promise<{ data: Order | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: input.user_id,
        status: "created" as OrderStatus,
        subtotal: input.subtotal,
        shipping_cost: input.shipping_cost,
        total: input.total,
        shipping_address: input.shipping_address,
        payment_method: input.payment_method || null,
        notes: input.notes || null
      })
      .select()
      .single();

    return { data: data as Order | null, error };
  }

  async createItems(items: CreateOrderItemInput[]): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("order_items")
      .insert(items);

    return { error };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    return { error };
  }

  async updatePaymentId(id: string, paymentId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("orders")
      .update({ payment_id: paymentId })
      .eq("id", id);

    return { error };
  }

  async addNote(id: string, note: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from("orders")
      .update({ notes: note })
      .eq("id", id);

    return { error };
  }

  async getByStatus(status: OrderStatus): Promise<{ data: Order[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    return { data: data as Order[] | null, error };
  }

  async getStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  }> {
    const { data: orders } = await supabase
      .from("orders")
      .select("status, total");

    if (!orders) {
      return { totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 };
    }

    return {
      totalOrders: orders.length,
      totalRevenue: orders.filter(o => o.status === "paid" || o.status === "delivered").reduce((sum, o) => sum + Number(o.total), 0),
      pendingOrders: orders.filter(o => ["created", "pending_payment", "packing", "shipped"].includes(o.status)).length,
      completedOrders: orders.filter(o => o.status === "delivered").length
    };
  }
}

export const ordersService = new OrdersService();
