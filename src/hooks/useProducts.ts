import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProductBrand = Database["public"]["Enums"]["product_brand"];

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: ProductBrand | null;
  price: number;
  original_price: number | null;
  images: string[] | null;
  category: string;
  description: string | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
}

interface UseProductsOptions {
  category?: string;
  brand?: ProductBrand | "all";
  featured?: boolean;
  active?: boolean;
}

export const BRANDS: { id: ProductBrand | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "VeryRio", label: "VeryRio" },
  { id: "Chalita", label: "Chalita" },
  { id: "LaytonVivian", label: "Layton Vivian" },
];

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("products")
        .select("id, name, slug, sku, brand, price, original_price, images, category, description, stock_quantity, is_active, is_featured")
        .order("created_at", { ascending: false });

      // Apply filters
      if (options.active !== false) {
        query = query.eq("is_active", true);
      }

      if (options.featured) {
        query = query.eq("is_featured", true);
      }

      if (options.category && options.category !== "all") {
        query = query.ilike("category", `%${options.category}%`);
      }

      if (options.brand && options.brand !== "all") {
        query = query.eq("brand", options.brand);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setProducts((data as Product[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch products"));
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [options.category, options.brand, options.featured, options.active]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

export function useProductSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, sku, brand, price, original_price, images, category, description, stock_quantity, is_active, is_featured")
        .eq("is_active", true)
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      setResults((data as Product[]) || []);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  return { results, searching, search };
}

// Utility function to format installment price
export function formatInstallmentPrice(price: number, installments: number = 3): string {
  const installmentValue = price / installments;
  return `${installments}x de R$ ${installmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function formatFullPrice(price: number): string {
  return `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}
