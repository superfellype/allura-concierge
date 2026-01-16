import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadService } from "@/services/upload.service";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "banner";
}

export default function ImageUploadField({
  value,
  onChange,
  label,
  folder = "editor",
  className,
  aspectRatio = "video",
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  }, []);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    const { url, error } = await uploadService.uploadImage(file, folder);
    
    if (error) {
      setError(error);
    } else if (url) {
      onChange(url);
    }

    setIsUploading(false);
  };

  const handleRemove = () => {
    onChange("");
  };

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[3/1]",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-xs font-medium text-foreground">{label}</label>
      )}

      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all overflow-hidden",
          aspectClasses[aspectRatio],
          isDragging
            ? "border-primary bg-primary/5"
            : value
            ? "border-border"
            : "border-border hover:border-primary/50",
          isUploading && "pointer-events-none opacity-70"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <AnimatePresence mode="wait">
          {value ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={value}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.label
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-4"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                    {isDragging ? (
                      <Upload className="w-5 h-5 text-primary" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground text-center">
                    {isDragging ? "Solte para enviar" : "Clique ou arraste uma imagem"}
                  </span>
                  <span className="text-xs text-muted-foreground/70 mt-1">
                    JPG, PNG, WEBP até 5MB
                  </span>
                </>
              )}
            </motion.label>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
