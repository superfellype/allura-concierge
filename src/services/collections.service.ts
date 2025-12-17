import { supabase } from "@/integrations/supabase/client";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  editorial_description: string | null;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  highlight_on_home: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionInput {
  name: string;
  slug?: string;
  editorial_description?: string | null;
  cover_image_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  highlight_on_home?: boolean;
  display_order?: number;
  is_active?: boolean;
}

class CollectionsService {
  async getAll() {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('display_order', { ascending: true });

    return { data: data as Collection[] | null, error };
  }

  async getActive() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('display_order', { ascending: true });

    return { data: data as Collection[] | null, error };
  }

  async getHighlighted() {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .eq('highlight_on_home', true)
      .order('display_order', { ascending: true });

    return { data: data as Collection[] | null, error };
  }

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .single();

    return { data: data as Collection | null, error };
  }

  async create(input: CollectionInput) {
    const slug = input.slug || this.generateSlug(input.name);
    
    const { data, error } = await supabase
      .from('collections')
      .insert([{ ...input, slug }])
      .select()
      .single();

    return { data: data as Collection | null, error };
  }

  async update(id: string, input: Partial<CollectionInput>) {
    const { data, error } = await supabase
      .from('collections')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    return { data: data as Collection | null, error };
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    return { error };
  }

  async toggleActive(id: string, is_active: boolean) {
    return this.update(id, { is_active });
  }

  async toggleHighlight(id: string, highlight_on_home: boolean) {
    return this.update(id, { highlight_on_home });
  }

  async getProductCollections(productId: string) {
    const { data, error } = await supabase
      .from('product_collections')
      .select('collection_id, collections(*)')
      .eq('product_id', productId);

    return { data, error };
  }

  async setProductCollections(productId: string, collectionIds: string[]) {
    // Remove existing
    await supabase
      .from('product_collections')
      .delete()
      .eq('product_id', productId);

    if (collectionIds.length === 0) return { error: null };

    // Add new
    const { error } = await supabase
      .from('product_collections')
      .insert(collectionIds.map(collection_id => ({
        product_id: productId,
        collection_id
      })));

    return { error };
  }

  async getCollectionProducts(collectionId: string) {
    const { data, error } = await supabase
      .from('product_collections')
      .select('product_id, products(*)')
      .eq('collection_id', collectionId)
      .order('display_order', { ascending: true });

    return { data, error };
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

export const collectionsService = new CollectionsService();
