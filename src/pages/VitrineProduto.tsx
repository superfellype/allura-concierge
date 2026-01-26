import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/price-utils";
import VitrineNav from "@/components/vitrine/VitrineNav";
import VitrineFooter from "@/components/vitrine/VitrineFooter";

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const VitrineProduto = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ["vitrine-product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, description, images, brand")
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
      <div className="min-h-screen bg-vitrine-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-vitrine-charcoal/20 border-t-vitrine-charcoal rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-vitrine-cream">
        <VitrineNav />
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="font-serif text-3xl text-vitrine-charcoal mb-6">
            Produto não encontrado
          </h1>
          <Link 
            to="/vitrine" 
            className="inline-flex items-center gap-2 text-vitrine-charcoal/60 hover:text-vitrine-charcoal transition-colors"
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

  return (
    <div className="min-h-screen bg-vitrine-cream text-vitrine-charcoal">
      <VitrineNav />
      
      <motion.main 
        className="pt-24 pb-20"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="container mx-auto px-6">
          {/* Back link */}
          <Link 
            to="/vitrine" 
            className="inline-flex items-center gap-2 text-sm text-vitrine-charcoal/50 hover:text-vitrine-charcoal transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
            {/* Image */}
            <motion.div 
              className="aspect-[4/5] bg-vitrine-sand rounded-sm overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Details */}
            <motion.div 
              className="flex flex-col justify-center py-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {product.brand && product.brand !== "Outro" && (
                <span className="text-xs tracking-[0.3em] uppercase text-vitrine-charcoal/40 mb-4">
                  {product.brand}
                </span>
              )}

              <h1 className="font-serif text-4xl md:text-5xl font-light text-vitrine-charcoal leading-tight mb-6">
                {product.name}
              </h1>

              <p className="text-2xl font-light text-vitrine-charcoal/80 mb-8">
                {formatCurrency(product.price)}
              </p>

              {product.description && (
                <p className="text-vitrine-charcoal/60 leading-relaxed mb-12 max-w-md">
                  {product.description}
                </p>
              )}

              {/* CTA WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-vitrine-charcoal text-vitrine-cream px-8 py-4 text-sm tracking-wider uppercase hover:bg-vitrine-charcoal/90 transition-colors w-full sm:w-auto"
              >
                <MessageCircle className="w-4 h-4" />
                Comprar pelo WhatsApp
              </a>

              <p className="text-xs text-vitrine-charcoal/40 mt-6">
                Atendimento personalizado via WhatsApp
              </p>
            </motion.div>
          </div>
        </div>
      </motion.main>

      <VitrineFooter />
    </div>
  );
};

export default VitrineProduto;
