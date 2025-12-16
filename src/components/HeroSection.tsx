import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden noise-overlay">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream-100 via-background to-cream-200" />
      
      {/* Floating Orbs */}
      <motion.div
        animate={{ 
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-[20%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-[10%] w-80 h-80 bg-accent/20 rounded-full blur-3xl"
      />

      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="glass inline-flex items-center gap-2 px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-body font-medium text-foreground/80">
                Nova Coleção Primavera 2024
              </span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-medium text-center leading-[1.1] tracking-tight text-balance"
          >
            Elegância que
            <br />
            <span className="text-primary italic">transcende</span> o tempo
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-body text-lg md:text-xl text-muted-foreground text-center max-w-2xl mx-auto mt-8"
          >
            Bolsas e acessórios artesanais, confeccionados com couro premium brasileiro. 
            Cada peça conta uma história de sofisticação.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-body font-medium rounded-full shadow-elegant hover:shadow-glow transition-all duration-300"
            >
              Explorar Coleção
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 glass font-body font-medium text-foreground rounded-full hover:bg-secondary/50 transition-all duration-300"
            >
              Nossa História
            </motion.button>
          </motion.div>

          {/* Bento Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
          >
            {/* Large Feature Card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.01 }}
              className="col-span-2 row-span-2 bento-card relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80"
                alt="Bolsa de couro caramelo"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20">
                <span className="text-xs font-body uppercase tracking-widest text-primary-foreground/80">
                  Em Destaque
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-medium text-primary-foreground mt-1">
                  Tote Bag Essencial
                </h3>
                <p className="font-body text-sm text-primary-foreground/80 mt-2">
                  A partir de R$ 1.890,00
                </p>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bento-card flex flex-col justify-center items-center text-center"
            >
              <span className="font-display text-4xl md:text-5xl font-semibold text-primary">
                12
              </span>
              <span className="font-body text-sm text-muted-foreground mt-1">
                Anos de tradição
              </span>
            </motion.div>

            {/* Craft Card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bento-card bg-primary/5"
            >
              <div className="flex flex-col h-full justify-between">
                <Sparkles className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-display text-lg font-medium">Feito à Mão</h4>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    100% artesanal
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quote Card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bento-card col-span-2 flex items-center"
            >
              <blockquote className="font-display text-lg md:text-xl italic text-foreground/80">
                "O luxo está nos detalhes que poucos percebem, mas todos sentem."
              </blockquote>
            </motion.div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-8 mt-16 opacity-60"
          >
            {["Couro Premium", "Entrega Segura", "Garantia Vitalícia", "Pagamento Facilitado"].map((badge) => (
              <span key={badge} className="font-body text-xs uppercase tracking-widest text-foreground/60">
                {badge}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
