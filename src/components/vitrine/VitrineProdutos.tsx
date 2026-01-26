import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/price-utils";

import "swiper/css";
import "swiper/css/free-mode";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
  brand: string | null;
}

const VitrineProdutos = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["vitrine-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, images, brand")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as Product[];
    }
  });

  if (isLoading) {
    return (
      <section className="py-24 bg-vitrine-sand/20">
        <div className="container mx-auto px-6">
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-[300px] md:w-[400px]"
              >
                <div className="aspect-[3/4] bg-vitrine-sand animate-pulse rounded-sm" />
                <div className="mt-4 h-4 bg-vitrine-sand animate-pulse rounded w-3/4" />
                <div className="mt-2 h-3 bg-vitrine-sand animate-pulse rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-24 md:py-32 bg-vitrine-sand/20">
      <div className="container mx-auto px-6 mb-12">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-vitrine-charcoal/40 block mb-3">
              Coleção
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-vitrine-charcoal">
              Peças em Destaque
            </h2>
          </div>
          <Link 
            to="/produtos" 
            className="hidden md:block text-xs tracking-[0.2em] uppercase text-vitrine-charcoal/50 hover:text-vitrine-charcoal transition-colors"
          >
            Ver todas →
          </Link>
        </div>
      </div>

      <div className="pl-6 md:pl-[calc((100vw-1280px)/2+24px)]">
        <Swiper
          modules={[FreeMode, Mousewheel]}
          spaceBetween={24}
          slidesPerView="auto"
          freeMode={{
            enabled: true,
            momentumRatio: 0.5,
            momentumVelocityRatio: 0.5
          }}
          mousewheel={{
            forceToAxis: true
          }}
          className="!overflow-visible"
        >
          {products.map((product, index) => (
            <SwiperSlide 
              key={product.id} 
              className="!w-[280px] md:!w-[360px] lg:!w-[400px]"
            >
              <ProductCard product={product} index={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="container mx-auto px-6 mt-12 md:hidden">
        <Link 
          to="/produtos" 
          className="text-xs tracking-[0.2em] uppercase text-vitrine-charcoal/50 hover:text-vitrine-charcoal transition-colors"
        >
          Ver todas as peças →
        </Link>
      </div>
    </section>
  );
};

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
  const image = product.images?.[0] || "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Link 
        to={`/vitrine/${product.slug}`}
        className="block group"
      >
        <div className="relative aspect-[3/4] bg-vitrine-sand rounded-sm overflow-hidden mb-4">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-vitrine-charcoal/0 group-hover:bg-vitrine-charcoal/5 transition-colors duration-500" />
        </div>

        <div className="space-y-1">
          {product.brand && product.brand !== "Outro" && (
            <span className="text-[10px] tracking-[0.25em] uppercase text-vitrine-charcoal/30">
              {product.brand}
            </span>
          )}
          <h3 className="font-serif text-lg font-light text-vitrine-charcoal group-hover:text-vitrine-charcoal/80 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-vitrine-charcoal/50">
            {formatCurrency(product.price)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default VitrineProdutos;
