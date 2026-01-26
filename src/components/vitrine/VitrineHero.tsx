import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const VitrineHero = () => {
  return (
    <section className="relative h-[90vh] flex items-end overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=2670&auto=format&fit=crop"
          alt="Bolsa de couro premium"
          className="w-full h-full object-cover"
        />
        {/* Subtle gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-vitrine-text/30 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          {/* Tag */}
          <span className="inline-block text-[11px] tracking-[0.2em] uppercase text-white/80 mb-4">
            Nova Coleção
          </span>

          {/* Title with Link */}
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-[1.1] tracking-[0.02em]">
            Universal —{" "}
            <Link
              to="/vitrine#produtos"
              className="underline underline-offset-4 decoration-1 hover:opacity-70 transition-opacity duration-300"
            >
              Confira os produtos agora
            </Link>
          </h2>
        </motion.div>
      </div>
    </section>
  );
};

export default VitrineHero;
