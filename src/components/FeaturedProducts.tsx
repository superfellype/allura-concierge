import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import logoFlower from "@/assets/logo-allura-flower.png";

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

const FeaturedProducts = () => {
  return (
    <section className="relative py-28 overflow-hidden noise-bg">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/4 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <img src={logoFlower} alt="" className="w-6 h-6 object-contain opacity-50" />
          </div>
          <span className="font-body text-xs uppercase tracking-[0.25em] text-primary/80">
            Seleção Exclusiva
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-medium mt-4 tracking-tight">
            Peças em Destaque
          </h2>
          <p className="font-body text-muted-foreground mt-4 max-w-md mx-auto leading-relaxed">
            Cada bolsa é uma escolha consciente entre forma, função e sensibilidade.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4 liquid-glass p-1">
                <div className="absolute inset-1 rounded-[1.35rem] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />
                  
                  {/* Wishlist Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute top-3 right-3 p-2.5 liquid-glass rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                  >
                    <Heart className="w-4 h-4 text-foreground" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    className="absolute bottom-4 left-4 right-4 py-3 liquid-glass-strong text-center font-body text-sm font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                  >
                    Ver Detalhes
                  </motion.button>
                </div>
              </div>
              <div className="px-1">
                <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                  {product.category}
                </span>
                <h3 className="font-display text-lg font-medium mt-1 group-hover:text-primary transition-colors duration-300">
                  {product.name}
                </h3>
                <p className="font-body text-sm text-foreground/70 mt-1">
                  {product.price}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mt-14"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group glass-button flex items-center gap-3 px-7 py-3.5 text-foreground"
          >
            Ver toda coleção
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
