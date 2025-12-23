import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProducts, BRANDS, formatInstallmentPrice, formatFullPrice } from "@/hooks/useProducts";
import type { Database } from "@/integrations/supabase/types";

type ProductBrand = Database["public"]["Enums"]["product_brand"];

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "bolsas", label: "Bolsas" },
  { id: "carteiras", label: "Carteiras" },
  { id: "acessorios", label: "Acessórios" },
  { id: "clutches", label: "Clutches" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Produtos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || 'all');
  const [selectedBrand, setSelectedBrand] = useState<ProductBrand | "all">(
    (searchParams.get('marca') as ProductBrand) || 'all'
  );
  const [showFilters, setShowFilters] = useState(false);

  const { products, loading } = useProducts({
    category: selectedCategory,
    brand: selectedBrand,
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      searchParams.delete('categoria');
    } else {
      searchParams.set('categoria', category);
    }
    setSearchParams(searchParams);
    setShowFilters(false);
  };

  const handleBrandChange = (brand: ProductBrand | "all") => {
    setSelectedBrand(brand);
    if (brand === 'all') {
      searchParams.delete('marca');
    } else {
      searchParams.set('marca', brand);
    }
    setSearchParams(searchParams);
  };

  const getProductImage = (product: { images: string[] | null }) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80";
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="font-body text-xs uppercase tracking-[0.25em] text-primary/80">
              Nossa Coleção
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-medium mt-4 tracking-tight">
              {selectedCategory === 'all' ? 'Todos os Produtos' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </h1>
            <p className="font-body text-muted-foreground mt-4 max-w-md mx-auto">
              Peças únicas, criadas com intenção e cuidado artesanal.
            </p>
          </motion.div>

          {/* Brand Filter Pills */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {BRANDS.map((brand) => (
              <button
                key={brand.id}
                onClick={() => handleBrandChange(brand.id)}
                className={`px-5 py-2.5 rounded-full font-body text-sm font-medium transition-all duration-300 ${
                  selectedBrand === brand.id
                    ? "glass-btn"
                    : "glass-btn-secondary"
                }`}
              >
                {brand.label}
              </button>
            ))}
          </motion.div>

          {/* Category Filter Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mb-10"
          >
            <div className="hidden md:flex items-center gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2.5 rounded-full font-body text-sm transition-all ${
                    selectedCategory === category.id
                      ? "liquid-glass-card bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2.5 liquid-glass-card rounded-full font-body text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtrar
            </button>

            <p className="font-body text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? 'produto' : 'produtos'}
            </p>
          </motion.div>

          {/* Mobile Filter Modal */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 md:hidden"
            >
              <div className="absolute inset-0 modal-overlay" onClick={() => setShowFilters(false)} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="absolute bottom-0 left-0 right-0 liquid-glass-card rounded-t-3xl p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display text-xl font-medium">Filtros</h3>
                  <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-secondary/50 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Brands */}
                <div className="mb-8">
                  <h4 className="font-body text-sm font-medium mb-4 text-muted-foreground">Marcas</h4>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => handleBrandChange(brand.id)}
                        className={`px-4 py-2.5 rounded-full font-body text-sm transition-all ${
                          selectedBrand === brand.id
                            ? "glass-btn"
                            : "glass-btn-secondary"
                        }`}
                      >
                        {brand.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="font-body text-sm font-medium mb-4 text-muted-foreground">Categorias</h4>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`px-4 py-2.5 rounded-full font-body text-sm transition-all ${
                          selectedCategory === category.id
                            ? "liquid-glass-card bg-primary/10 text-foreground"
                            : "liquid-glass-card text-muted-foreground"
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-3xl bg-muted/50 mb-4" />
                  <div className="h-3 bg-muted/50 rounded w-1/3 mb-2" />
                  <div className="h-5 bg-muted/50 rounded w-2/3 mb-2" />
                  <div className="h-4 bg-muted/50 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-body text-muted-foreground">
                Nenhum produto encontrado com esses filtros.
              </p>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {products.map((product) => (
                <motion.article
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -6 }}
                  className="group"
                >
                  <Link to={`/produto/${product.slug}`} className="block">
                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4 liquid-glass-card p-1.5">
                      <div className="absolute inset-1.5 rounded-[1.25rem] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                        />
                        
                        {/* SKU Badge */}
                        {product.sku && (
                          <span className="absolute top-4 left-4 px-2.5 py-1 liquid-glass-card text-xs font-mono text-foreground/80 z-20">
                            #{product.sku}
                          </span>
                        )}
                        
                        {/* Brand Badge */}
                        {product.brand && product.brand !== "Outro" && (
                          <span className="absolute top-4 right-4 status-badge status-badge-info z-20">
                            {product.brand}
                          </span>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => e.preventDefault()}
                          className="absolute bottom-4 right-4 p-2.5 liquid-glass-card rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                        >
                          <Heart className="w-4 h-4 text-foreground" />
                        </motion.button>

                        <motion.div
                          className="absolute bottom-4 left-4 right-16 py-3 liquid-glass-card text-center font-body text-sm font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                        >
                          Ver Detalhes
                        </motion.div>
                      </div>
                    </div>
                    <div className="px-1">
                      <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                        {product.category}
                      </span>
                      <h3 className="font-display text-lg font-medium mt-1 group-hover:text-primary transition-colors duration-300">
                        {product.name}
                      </h3>
                      <div className="mt-2 space-y-0.5">
                        <p className="font-body text-sm text-primary font-medium">
                          {formatInstallmentPrice(product.price)}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          ou {formatFullPrice(product.price)} à vista
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Produtos;