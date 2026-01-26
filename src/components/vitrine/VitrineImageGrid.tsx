import { motion } from "framer-motion";

const VitrineImageGrid = () => {
  return (
    <section className="py-16 md:py-24 bg-vitrine-bg">
      <div className="max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24">
        {/* Two-column image grid like reference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <motion.div
            className="aspect-[4/5] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2669&auto=format&fit=crop"
              alt="Detalhe artesanal"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            className="aspect-[4/5] overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=2676&auto=format&fit=crop"
              alt="Couro premium"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VitrineImageGrid;
