import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadService } from "@/services/upload.service";
import { toast } from "sonner";

interface SingleImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  aspectRatio?: "square" | "banner" | "logo";
}

const SingleImageUpload = ({ 
  value, 
  onChange, 
  folder = "site-assets",
  label = "Imagem",
  aspectRatio = "square"
}: SingleImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const aspectClasses = {
    square: "aspect-square",
    banner: "aspect-[16/9]",
    logo: "aspect-[3/1]"
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);
    
    const { url, error } = await uploadService.uploadImage(file, folder);
    
    if (error) {
      toast.error(error);
    } else if (url) {
      onChange(url);
      toast.success("Imagem enviada!");
    }
    
    setUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      
      {value ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`relative ${aspectClasses[aspectRatio]} rounded-xl overflow-hidden border border-border bg-muted group`}
        >
          <img
            src={value}
            alt={label}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <label className="p-2 rounded-full bg-background/90 text-foreground hover:bg-background transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
          className={`
            relative ${aspectClasses[aspectRatio]} border-2 border-dashed rounded-xl transition-all duration-300 flex items-center justify-center
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                Arraste ou clique para enviar
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SingleImageUpload;
