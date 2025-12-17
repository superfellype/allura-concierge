import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "product-images";

class UploadService {
  async uploadProductImage(file: File, productId?: string): Promise<{ url: string | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        return { url: null, error: new Error('Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou GIF') };
      }

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        return { url: null, error: new Error('Arquivo muito grande. Máximo: 5MB') };
      }

      const fileName = `${productId || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { url: null, error: uploadError };
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (error: any) {
      console.error('Upload service error:', error);
      return { url: null, error };
    }
  }

  async uploadMultipleImages(files: File[], productId?: string): Promise<{ urls: string[]; errors: string[] }> {
    const results = await Promise.all(
      files.map(file => this.uploadProductImage(file, productId))
    );

    const urls: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.url) {
        urls.push(result.url);
      } else {
        errors.push(`${files[index].name}: ${result.error?.message || 'Erro desconhecido'}`);
      }
    });

    return { urls, errors };
  }

  async deleteImage(url: string): Promise<{ error: Error | null }> {
    try {
      // Extract path from URL
      const path = url.split(`${BUCKET_NAME}/`)[1];
      if (!path) {
        return { error: new Error('URL inválida') };
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

      return { error };
    } catch (error: any) {
      return { error };
    }
  }

  async uploadAvatar(file: File, userId: string): Promise<{ url: string | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
      
      if (!fileExt || !allowedTypes.includes(fileExt)) {
        return { url: null, error: new Error('Tipo de arquivo não permitido') };
      }

      if (file.size > 2 * 1024 * 1024) {
        return { url: null, error: new Error('Arquivo muito grande. Máximo: 2MB') };
      }

      const fileName = `${userId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return { url: null, error: uploadError };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return { url: publicUrl, error: null };
    } catch (error: any) {
      return { url: null, error };
    }
  }
}

export const uploadService = new UploadService();
