import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import logoFlower from "@/assets/logo-allura-flower.png";
import logoBadge from "@/assets/logo-allura-badge.png";
const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};
const HeroSection = () => {
  return <section className="relative min-h-screen overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cream-100 via-background to-cream-200" />
      
      {/* Morphing Blob Background */}
      <motion.div animate={{
      x: [0, 30, 0],
      y: [0, -20, 0]
    }} transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }} className="absolute top-20 right-[20%] w-[500px] h-[500px] bg-gradient-to-br from-primary/15 to-accent/20 rounded-full blur-3xl animate-morph" />
      <motion.div animate={{
      x: [0, -20, 0],
      y: [0, 30, 0]
    }} transition={{
      duration: 10,
      repeat: Infinity,
      ease: "easeInOut"
    }} className="absolute bottom-20 left-[10%] w-96 h-96 bg-gradient-to-tr from-accent/20 to-primary/10 rounded-full blur-3xl animate-morph" style={{
      animationDelay: "-4s"
    }} />

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
      backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
      backgroundSize: '60px 60px'
    }} />

      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto">
          {/* Floating Badge with Logo */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="floating-badge">
              <img src={logoFlower} alt="" className="w-5 h-5 object-contain" />
              <span className="text-sm font-body font-medium text-foreground/80">
                Nova Coleção Primavera 2024
              </span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 variants={itemVariants} className="font-display text-5xl md:text-7xl lg:text-8xl font-medium text-center leading-[1.1] tracking-tight text-balance">
            Elegância que
            <br />
            <span className="text-gradient italic">transcende</span> o tempo
          </motion.h1>

          <motion.p variants={itemVariants} className="font-body text-lg md:text-xl text-muted-foreground text-center max-w-2xl mx-auto mt-8">
            Bolsas e acessórios artesanais, confeccionados com couro premium brasileiro. 
            Cada peça conta uma história de sofisticação.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <motion.button whileHover={{
            scale: 1.03,
            y: -2
          }} whileTap={{
            scale: 0.98
          }} className="liquid-button group flex items-center gap-3 px-8 py-4 text-primary-foreground">
              Explorar Coleção
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <motion.button whileHover={{
            scale: 1.03
          }} whileTap={{
            scale: 0.98
          }} className="px-8 py-4 liquid-glass font-body font-medium text-foreground rounded-full transition-all duration-300">
              Nossa História
            </motion.button>
          </motion.div>

          {/* Bento Grid */}
          <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
            {/* Large Feature Card */}
            <motion.div variants={itemVariants} whileHover={{
            y: -5,
            scale: 1.01
          }} className="col-span-2 row-span-2 liquid-card relative overflow-hidden group cursor-pointer p-0">
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent z-10" />
              <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80" alt="Bolsa de couro caramelo" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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

            {/* Stats Card with Badge */}
            <motion.div variants={itemVariants} whileHover={{
            y: -5
          }} className="liquid-card flex flex-col justify-center items-center text-center">
              <img src={logoBadge} alt="" className="w-16 h-16 object-contain mb-2 opacity-80" />
              <span className="font-display text-3xl md:text-4xl font-semibold text-primary">
                Peças exclusivas. 
              </span>
              <span className="font-body text-sm text-muted-foreground mt-1">
                Acabamento premium.   
              </span>
            </motion.div>

            {/* Craft Card */}
            <motion.div variants={itemVariants} whileHover={{
            y: -5
          }} className="liquid-card bg-primary/5">
              <div className="flex flex-col h-full justify-between">
                <img alt="" src="/lovable-uploads/bf5246a6-5ff7-4215-8182-bf6af4e3daab.png" className="w-10 h-10 object-cover" />
                <div>
                  <h4 className="font-display text-lg font-medium">Feito à Mão</h4>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    100% artesanal
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quote Card */}
            <motion.div variants={itemVariants} whileHover={{
            y: -5
          }} className="liquid-card col-span-2 flex items-center">
              <blockquote className="font-display text-lg md:text-xl italic text-foreground/80">
                "O luxo está nos detalhes que poucos percebem, mas todos sentem."
              </blockquote>
            </motion.div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-8 mt-16">
            {["Couro Premium", "Entrega Segura", "Garantia Vitalícia", "Pagamento Facilitado"].map((badge, i) => <motion.span key={badge} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 0.6,
            y: 0
          }} transition={{
            delay: 1 + i * 0.1
          }} className="font-body text-xs uppercase tracking-widest text-foreground/60">
                {badge}
              </motion.span>)}
          </motion.div>
        </motion.div>
      </div>
    </section>;
};
export default HeroSection;