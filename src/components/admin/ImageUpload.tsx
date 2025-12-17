import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, GripVertical, ImageIcon, Loader2, Star } from "lucide-react";
import { uploadService } from "@/services/upload.service";
import { toast } from "sonner";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  productId?: string;
}

const ImageUpload = ({ images, onChange, productId }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    if (files.length === 0) return;

    await uploadFiles(files);
  }, [images, productId]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    await uploadFiles(files);
    e.target.value = '';
  }, [images, productId]);

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    
    const { urls, errors } = await uploadService.uploadMultipleImages(files, productId);
    
    if (urls.length > 0) {
      onChange([...images, ...urls]);
      toast.success(`${urls.length} imagem(ns) enviada(s)`);
    }
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }
    
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const setCoverImage = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.unshift(moved);
    onChange(newImages);
    toast.success("Imagem de capa definida");
  };

  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const [moved] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, moved);
    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-body text-sm text-muted-foreground">Enviando imagens...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-body font-medium text-foreground">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  JPG, PNG, WEBP ou GIF • Máximo 5MB cada
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Grid */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {images.map((img, idx) => (
              <motion.div
                key={img}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                draggable
                onDragStart={() => handleImageDragStart(idx)}
                onDragOver={(e) => handleImageDragOver(e, idx)}
                onDragEnd={handleImageDragEnd}
                className={`
                  relative aspect-square rounded-xl overflow-hidden group cursor-move
                  ${draggedIndex === idx ? 'opacity-50' : ''}
                  ${idx === 0 ? 'ring-2 ring-primary ring-offset-2' : ''}
                `}
              >
                <img
                  src={img}
                  alt={`Imagem ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setCoverImage(idx)}
                    className={`p-2 rounded-full bg-background/90 text-foreground hover:bg-background transition-colors ${idx === 0 ? 'hidden' : ''}`}
                    title="Definir como capa"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    title="Remover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drag Handle */}
                <div className="absolute top-2 left-2 p-1 rounded bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-foreground/70" />
                </div>

                {/* Cover Badge */}
                {idx === 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Capa
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {images.length === 0 && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          <span className="font-body text-sm">Nenhuma imagem adicionada</span>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
