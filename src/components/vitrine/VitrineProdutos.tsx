import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/price-utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
  brand: string | null;
  category: string | null;
}

const VitrineProdutos = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["vitrine-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, images, brand, category")
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
      <section id="produtos" className="py-24 md:py-32 lg:py-40 bg-vitrine-bg">
        <div className="max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24">
          <div className="text-center mb-16">
            <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-vitrine-text tracking-[0.02em]">
              Luxo essencial
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-vitrine-border rounded-sm" />
                <div className="mt-4 h-4 bg-vitrine-border rounded w-1/3 mx-auto" />
                <div className="mt-2 h-3 bg-vitrine-border rounded w-1/4 mx-auto" />
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
    <section id="produtos" className="py-24 md:py-32 lg:py-40 bg-vitrine-bg">
      <div className="max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-vitrine-text tracking-[0.02em] leading-[1.2]">
            Luxo essencial
          </h3>
          <Link
            to="/vitrine"
            className="inline-block mt-6 text-[13px] tracking-[0.12em] uppercase text-vitrine-text/60 hover:text-vitrine-text transition-colors duration-300"
          >
            Confira as bolsas
          </Link>
        </motion.div>

        {/* Product Grid - Editorial Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
  const image = product.images?.[0] || "/placeholder.svg";
  const category = product.category?.toLowerCase() || "bolsas";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1] 
      }}
    >
      <Link 
        to={`/vitrine/${product.slug}`}
        className="block group"
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] bg-vitrine-sand overflow-hidden">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:opacity-90"
          />
        </div>

        {/* Product Info - Centered */}
        <div className="mt-5 text-center">
          {/* Category Tag */}
          <span className="block text-[11px] tracking-[0.12em] uppercase text-vitrine-text-secondary mb-1">
            {category}
          </span>

          {/* Product Name */}
          <h4 className="font-serif text-lg font-normal text-vitrine-text tracking-[0.02em]">
            {product.name}
          </h4>

          {/* Price */}
          <p className="mt-2 text-[13px] text-vitrine-text-secondary">
            {formatCurrency(product.price)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
};

export default VitrineProdutos;
