import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/payment/infinitepay-adapter";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  images: string[] | null;
  category: string;
  description: string | null;
}

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "bolsas", label: "Bolsas" },
  { id: "carteiras", label: "Carteiras" },
  { id: "acessorios", label: "Acessórios" },
  { id: "clutches", label: "Clutches" },
];

const Produtos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || 'all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('id, name, slug, price, original_price, images, category, description')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.ilike('category', `%${selectedCategory}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&q=80";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
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

          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="hidden md:flex items-center gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                    selectedCategory === category.id
                      ? "liquid-glass bg-primary/10 text-foreground"
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
              className="md:hidden flex items-center gap-2 px-4 py-2 liquid-glass rounded-full font-body text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtrar
            </button>

            <p className="font-body text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? 'produto' : 'produtos'}
            </p>
          </div>

          {/* Mobile Filter Modal */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 md:hidden"
            >
              <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="absolute bottom-0 left-0 right-0 liquid-glass rounded-t-3xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-lg font-medium">Categorias</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`px-4 py-2 rounded-full font-body text-sm transition-all ${
                        selectedCategory === category.id
                          ? "liquid-glass bg-primary/10 text-foreground"
                          : "liquid-glass text-muted-foreground"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
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
                Nenhum produto encontrado nesta categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  whileHover={{ y: -6 }}
                  className="group"
                >
                  <Link to={`/produto/${product.slug}`} className="block">
                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden mb-4 liquid-glass p-1">
                      <div className="absolute inset-1 rounded-[1.35rem] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                        />
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => e.preventDefault()}
                          className="absolute top-3 right-3 p-2.5 liquid-glass rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                        >
                          <Heart className="w-4 h-4 text-foreground" />
                        </motion.button>

                        <motion.div
                          className="absolute bottom-4 left-4 right-4 py-3 liquid-glass-strong text-center font-body text-sm font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
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
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-body text-sm text-foreground/70">
                          {formatPrice(product.price)}
                        </p>
                        {product.original_price && product.original_price > product.price && (
                          <p className="font-body text-xs text-muted-foreground line-through">
                            {formatPrice(product.original_price)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Produtos;
