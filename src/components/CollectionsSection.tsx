import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const collections = [
  {
    name: "Bolsas",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80",
    description: "Elegância para o dia a dia",
    slug: "bolsas",
  },
  {
    name: "Carteiras",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80",
    description: "Organização com estilo",
    slug: "carteiras",
  },
  {
    name: "Acessórios",
    image: "https://images.unsplash.com/photo-1611923134239-b9be5816e23c?w=600&q=80",
    description: "Detalhes que fazem a diferença",
    slug: "acessorios",
  },
];

const CollectionsSection = () => {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
      
      <div className="relative z-10 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="font-body text-xs uppercase tracking-[0.25em] text-primary/80">
            Navegue por Categoria
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-medium mt-4">
            Nossas Coleções
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Link
                to={`/produtos?categoria=${collection.slug}`}
                className="group block relative aspect-[4/5] rounded-3xl overflow-hidden liquid-glass p-1"
              >
                <div className="absolute inset-1 rounded-[1.35rem] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent z-10" />
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-20">
                    <h3 className="font-display text-2xl font-medium text-primary-foreground">
                      {collection.name}
                    </h3>
                    <p className="font-body text-sm text-primary-foreground/80 mt-1">
                      {collection.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-primary-foreground/90 font-body text-sm">
                      <span>Ver coleção</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionsSection;
