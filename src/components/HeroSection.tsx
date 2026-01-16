import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import logoFlower from "@/assets/logo-allura-flower.png";
import logoBadge from "@/assets/logo-allura-badge.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const HeroSection = () => {
  const { settings, loading } = useSiteSettings();
  
  // Get settings with fallbacks
  const heroTitle = settings.hero_title || "Elegância que se sente";
  const heroSubtitle = settings.hero_subtitle || "Bolsas e acessórios em couro premium brasileiro.";
  const ctaText = settings.hero_cta_text || "Explorar Coleção";
  const ctaUrl = settings.hero_cta_link || "/produtos";
  const heroImageUrl = settings.hero_image_url || "";
  const heroBgColor = settings.hero_bg_color || "";
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Gradient Background - Deeper for Liquid Glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(30_25%_97%)] via-[hsl(35_30%_94%)] to-[hsl(25_20%_90%)]" />
      
      {/* Animated Gradient Blobs */}
      <motion.div
        animate={{ 
          x: [0, 30, 0], 
          y: [0, -20, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-[10%] w-[700px] h-[700px] bg-gradient-to-br from-primary/12 to-accent/18 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          x: [0, -20, 0], 
          y: [0, 25, 0],
          scale: [1, 1.08, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-[5%] w-[500px] h-[500px] bg-gradient-to-tr from-accent/15 to-primary/10 rounded-full blur-3xl"
      />

      {/* Noise Overlay */}
      <div className="absolute inset-0 noise-overlay" />

      <div className="relative z-10 container mx-auto px-6 pt-28 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto"
        >
          {/* Floating Badge - Liquid Glass */}
          <motion.div variants={itemVariants} className="flex justify-center mb-10">
            <div className="liquid-glass-card px-5 py-2.5 rounded-full inline-flex items-center gap-3 cursor-pointer group">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-body font-medium text-foreground/80">
                Primavera 2024
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-foreground/50 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-5xl md:text-7xl lg:text-[5.5rem] font-medium text-center leading-[1.05] tracking-tight text-balance"
          >
            {heroTitle.includes(' ') ? (
              <>
                {heroTitle.split(' ').slice(0, -2).join(' ')}
                <br />
                <span className="text-gradient italic">{heroTitle.split(' ').slice(-2).join(' ')}</span>
              </>
            ) : (
              <span className="text-gradient italic">{heroTitle}</span>
            )}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-body text-lg md:text-xl text-muted-foreground text-center max-w-xl mx-auto mt-8 leading-relaxed"
          >
            {heroSubtitle}
          </motion.p>

          {/* CTA Buttons - Glass Style */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
          >
            <Link to={ctaUrl}>
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="glass-btn flex items-center gap-3"
              >
                <ShoppingBag className="w-4 h-4" />
                {ctaText}
              </motion.button>
            </Link>
            <Link to="/sobre">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="glass-btn-secondary flex items-center gap-3"
              >
                Conhecer a Allura
              </motion.button>
            </Link>
          </motion.div>


          {/* Bento Grid - Liquid Glass Cards */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mt-20"
          >
            {/* Large Feature Card */}
            <motion.div
              variants={itemVariants}
              className="col-span-2 row-span-2 liquid-glass-card hover-zoom relative overflow-hidden group cursor-pointer p-0 min-h-[420px]"
            >
              <Link to="/produtos" className="block h-full">
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent z-10" />
                <img
                  src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80"
                  alt="Bolsa de couro caramelo"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Quick Add Overlay */}
                <div className="quick-action z-20">
                  <span className="glass-btn-secondary">
                    Ver Produto
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <span className="glass-badge text-primary-foreground/80 mb-3 inline-block">
                    Em Destaque
                  </span>
                  <h3 className="font-display text-2xl md:text-3xl font-medium text-primary-foreground mt-2">
                    Tote Bag Essencial
                  </h3>
                  <div className="mt-3">
                    <span className="font-body text-lg font-semibold text-primary-foreground">
                      3x R$ 630,00
                    </span>
                    <span className="font-body text-sm text-primary-foreground/60 ml-2">
                      ou R$ 1.890,00 à vista
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Stats Card - Liquid Glass */}
            <motion.div
              variants={itemVariants}
              className="liquid-glass-card flex flex-col justify-center items-center text-center p-6"
            >
              <img src={logoBadge} alt="" className="w-14 h-14 object-contain mb-4 opacity-90" />
              <span className="glass-kpi glass-kpi-md text-primary">100+</span>
              <span className="font-body text-sm text-muted-foreground mt-2">
                Peças exclusivas
              </span>
            </motion.div>

            {/* Craft Card - Liquid Glass */}
            <motion.div
              variants={itemVariants}
              className="liquid-glass-card p-6"
            >
              <div className="flex flex-col h-full justify-between">
                <div className="glass-icon glass-icon-md mb-4">
                  <img
                    alt=""
                    className="w-6 h-6 object-contain"
                    src="/lovable-uploads/6351425d-e06d-44af-b34c-808f57aef673.png"
                  />
                </div>
                <div>
                  <h4 className="font-display text-lg font-medium">Feito à Mão</h4>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    100% artesanal brasileiro
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quote Card - Liquid Glass */}
            <motion.div
              variants={itemVariants}
              className="liquid-glass-card col-span-2 flex items-center p-6 md:p-8"
            >
              <blockquote className="font-display text-lg md:text-xl italic text-foreground/80 leading-relaxed">
                "O luxo está nos detalhes que poucos percebem, mas todos sentem."
              </blockquote>
            </motion.div>
          </motion.div>

          {/* Trust Badges - Glass Style */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 mt-16"
          >
            {["Couro Premium", "Entrega Segura", "Garantia Vitalícia", "Parcelamento"].map((badge, i) => (
              <motion.span
                key={badge}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.08 }}
                className="glass-badge text-foreground/50 hover:text-foreground/80 transition-colors cursor-default"
              >
                {badge}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
