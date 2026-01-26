import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/price-utils";
import VitrineNav from "@/components/vitrine/VitrineNav";
import VitrineFooter from "@/components/vitrine/VitrineFooter";

const VitrineProduto = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ["vitrine-product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, description, images, brand, category")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  const whatsappNumber = "5534999281320";
  const whatsappMessage = product 
    ? `Olá! Tenho interesse no produto: ${product.name}`
    : "Olá! Gostaria de saber mais sobre os produtos.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vitrine-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-vitrine-text/20 border-t-vitrine-text rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-vitrine-bg">
        <VitrineNav />
        <div className="max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24 pt-32 pb-20 text-center">
          <h1 className="font-serif text-3xl text-vitrine-text mb-6">
            Produto não encontrado
          </h1>
          <Link 
            to="/vitrine" 
            className="inline-flex items-center gap-2 text-[13px] tracking-[0.12em] uppercase text-vitrine-text/60 hover:text-vitrine-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à vitrine
          </Link>
        </div>
        <VitrineFooter />
      </div>
    );
  }

  const mainImage = product.images?.[0] || "/placeholder.svg";
  const category = product.category?.toLowerCase() || "bolsas";

  return (
    <div className="min-h-screen bg-vitrine-bg text-vitrine-text">
      <VitrineNav />
      
      <main className="pt-24 pb-20">
        <div className="max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Link 
              to="/vitrine" 
              className="inline-flex items-center gap-2 text-[13px] tracking-[0.12em] uppercase text-vitrine-text/50 hover:text-vitrine-text transition-colors mb-12"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Voltar
            </Link>
          </motion.div>

          {/* Product Layout - 60/40 split as per spec */}
          <div className="grid lg:grid-cols-[60%_40%] gap-12 lg:gap-16">
            {/* Image - 60% */}
            <motion.div 
              className="aspect-[3/4] bg-vitrine-sand overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Details - 40% */}
            <motion.div 
              className="flex flex-col justify-center lg:pl-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Category */}
              <span className="text-[11px] tracking-[0.12em] uppercase text-vitrine-text-secondary mb-4">
                {category}
              </span>

              {/* Name */}
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-vitrine-text leading-[1.1] tracking-[0.02em] mb-6">
                {product.name}
              </h1>

              {/* Price */}
              <p className="text-xl md:text-2xl font-normal text-vitrine-text/80 mb-8">
                {formatCurrency(product.price)}
              </p>

              {/* Description */}
              {product.description && (
                <p className="font-sans text-base leading-[1.7] text-vitrine-text-secondary mb-12 max-w-md">
                  {product.description}
                </p>
              )}

              {/* CTA - Textual button style */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-vitrine-text text-vitrine-surface px-8 py-4 text-[13px] tracking-[0.12em] uppercase hover:opacity-80 transition-opacity duration-300 w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                Comprar pelo WhatsApp
              </a>

              <p className="text-[12px] text-vitrine-text/40 mt-6">
                Atendimento personalizado via WhatsApp
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      <VitrineFooter />
    </div>
  );
};

export default VitrineProduto;
