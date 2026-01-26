import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import logoFlower from "@/assets/logo-allura-flower.png";

const VitrineHero = () => {
  const whatsappUrl = "https://wa.me/5534999281320?text=Olá! Gostaria de conhecer mais sobre a Allura.";

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-vitrine-cream via-vitrine-cream to-vitrine-sand/30" />
      
      {/* Decorative flower - subtle */}
      <motion.img
        src={logoFlower}
        alt=""
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] opacity-[0.03] pointer-events-none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Brand tagline */}
          <span className="block text-xs tracking-[0.4em] uppercase text-vitrine-charcoal/40 mb-8">
            Couro Premium Brasileiro
          </span>

          {/* Main headline */}
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light text-vitrine-charcoal leading-[1.1] tracking-tight mb-8">
            Elegância
            <br />
            <em className="font-normal">que se sente</em>
          </h1>

          {/* Subline */}
          <p className="font-sans text-lg md:text-xl text-vitrine-charcoal/50 font-light max-w-md mx-auto mb-12">
            Bolsas e acessórios pensados para acompanhar momentos reais.
          </p>

          {/* CTA */}
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 text-sm tracking-[0.15em] uppercase text-vitrine-charcoal/70 hover:text-vitrine-charcoal transition-colors group"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.3 }}
          >
            <MessageCircle className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
            Fale conosco
          </motion.a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <motion.div
          className="w-px h-12 bg-gradient-to-b from-vitrine-charcoal/20 to-transparent"
          animate={{ scaleY: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
};

export default VitrineHero;
