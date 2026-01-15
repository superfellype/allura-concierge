import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Heart } from "lucide-react";
import { formatInstallmentPrice, formatFullPrice } from "@/hooks/useProducts";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  image?: string | null;
  category?: string;
  sku?: string | null;
  brand?: string | null;
  showQuickAdd?: boolean;
  onQuickAdd?: () => void;
}

const ProductCard = ({
  name,
  slug,
  price,
  originalPrice,
  image,
  category,
  sku,
  brand,
  showQuickAdd = false,
  onQuickAdd
}: ProductCardProps) => {
  const discount = originalPrice
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link to={`/produto/${slug}`} className="block">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-4">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          
          {/* Brand Badge */}
          {brand && brand !== "Outro" && (
            <span className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
              {brand}
            </span>
          )}
          
          {/* Discount badge */}
          {discount > 0 && (
            <span className="absolute bottom-3 left-3 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
              -{discount}%
            </span>
          )}

          {/* Quick actions overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {showQuickAdd && (
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickAdd?.();
                }}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                <ShoppingBag className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                <Heart className="w-4 h-4 text-foreground" />
              </button>
            </div>
          )}
        </div>

        {category && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {category}
          </p>
        )}
        
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          {name}
        </h3>
        
        <div className="space-y-0.5">
          <span className="text-sm font-medium text-primary">
            {formatInstallmentPrice(price)}
          </span>
          <p className="text-xs text-muted-foreground">
            ou {formatFullPrice(price)} à vista
          </p>
          {originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatFullPrice(originalPrice)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
