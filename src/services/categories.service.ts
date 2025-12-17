import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  display_order?: number;
  is_active?: boolean;
  parent_id?: string | null;
}

class CategoriesService {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    return { data: data as Category[] | null, error };
  }

  async getActive() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    return { data: data as Category[] | null, error };
  }

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    return { data: data as Category | null, error };
  }

  async create(input: CategoryInput) {
    const slug = input.slug || this.generateSlug(input.name);
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...input, slug }])
      .select()
      .single();

    return { data: data as Category | null, error };
  }

  async update(id: string, input: Partial<CategoryInput>) {
    const { data, error } = await supabase
      .from('categories')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    return { data: data as Category | null, error };
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    return { error };
  }

  async toggleActive(id: string, is_active: boolean) {
    return this.update(id, { is_active });
  }

  async updateOrder(categories: { id: string; display_order: number }[]) {
    const promises = categories.map(cat =>
      supabase
        .from('categories')
        .update({ display_order: cat.display_order })
        .eq('id', cat.id)
    );

    const results = await Promise.all(promises);
    const error = results.find(r => r.error)?.error;
    return { error };
  }

  async getProductCategories(productId: string) {
    const { data, error } = await supabase
      .from('product_categories')
      .select('category_id, categories(*)')
      .eq('product_id', productId);

    return { data, error };
  }

  async setProductCategories(productId: string, categoryIds: string[]) {
    // Remove existing
    await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId);

    if (categoryIds.length === 0) return { error: null };

    // Add new
    const { error } = await supabase
      .from('product_categories')
      .insert(categoryIds.map(category_id => ({
        product_id: productId,
        category_id
      })));

    return { error };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

export const categoriesService = new CategoriesService();
