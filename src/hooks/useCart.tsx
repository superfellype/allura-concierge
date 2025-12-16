import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  attributes: Json | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    original_price: number | null;
    images: string[] | null;
    stock_quantity: number;
  };
}

export const useCart = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          attributes,
          product:products (
            id,
            name,
            slug,
            price,
            original_price,
            images,
            stock_quantity
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      setItems((data as unknown as CartItem[]) || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Subscribe to cart changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchCart();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCart]);

  const addItem = async (productId: string, quantity: number = 1, attributes?: Json) => {
    if (!user) {
      toast.error('Faça login para adicionar ao carrinho');
      return false;
    }

    setUpdating(true);

    try {
      // Check if item already exists
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert([{
            user_id: user.id,
            product_id: productId,
            quantity,
            attributes: attributes || null
          }]);

        if (error) throw error;
      }

      toast.success('Adicionado ao carrinho!');
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar ao carrinho');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      return removeItem(itemId);
    }

    setUpdating(true);

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Erro ao atualizar quantidade');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Item removido');
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Erro ao remover item');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!user) return false;

    setUpdating(true);

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setItems([]);
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return {
    items,
    loading,
    updating,
    itemCount,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refetch: fetchCart
  };
};
