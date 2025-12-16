import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Bolsa Tote Clássica",
    price: "R$ 1.890,00",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80",
    category: "Totes",
  },
  {
    id: 2,
    name: "Clutch Noturna",
    price: "R$ 890,00",
    image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&q=80",
    category: "Clutches",
  },
  {
    id: 3,
    name: "Shoulder Bag Couro",
    price: "R$ 1.450,00",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=600&q=80",
    category: "Shoulder",
  },
  {
    id: 4,
    name: "Mini Bag Essencial",
    price: "R$ 690,00",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80",
    category: "Mini",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const FeaturedProducts = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-cream-100/50 to-background" />

      <div className="relative z-10 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary">
            Seleção Exclusiva
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-medium mt-4">
            Peças em Destaque
          </h2>
          <p className="font-body text-muted-foreground mt-4 max-w-lg mx-auto">
            Descubra nossa curadoria especial, onde cada bolsa é uma declaração de estilo atemporal.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {products.map((product) => (
            <motion.article
              key={product.id}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileHover={{ scale: 1.05 }}
                  className="absolute bottom-4 left-4 right-4 py-3 glass text-center font-body text-sm font-medium rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                >
                  Ver Detalhes
                </motion.button>
              </div>
              <div className="px-2">
                <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                  {product.category}
                </span>
                <h3 className="font-display text-lg font-medium mt-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="font-body text-sm text-foreground/80 mt-1">
                  {product.price}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.03, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="group flex items-center gap-3 font-body font-medium text-primary"
          >
            Ver toda coleção
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
