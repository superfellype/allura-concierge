import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, ArrowLeft, Minus, Plus, Check, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatPrice } from "@/lib/payment/infinitepay-adapter";
import { formatInstallment, calculateDiscount } from "@/lib/price-utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  images: string[] | null;
  category: string;
  attributes: Record<string, unknown> | null;
  stock_quantity: number;
}

const Produto = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, description, price, original_price, images, category, attributes, stock_quantity')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        navigate('/404');
        return;
      }

      setProduct(data as Product);

      const { data: related } = await supabase
        .from('products')
        .select('id, name, slug, description, price, original_price, images, category, attributes, stock_quantity')
        .eq('category', data.category)
        .eq('is_active', true)
        .neq('id', data.id)
        .limit(4);

      if (related) {
        setRelatedProducts(related as Product[]);
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Faça login para adicionar ao carrinho');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!product) return;

    setAddingToCart(true);

    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity,
            attributes: selectedAttributes
          });

        if (error) throw error;
      }

      toast.success('Adicionado ao carrinho!');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background noise-bg">
        <Navbar />
        <main className="pt-32 pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse grid md:grid-cols-2 gap-12">
              <div className="aspect-square rounded-3xl bg-muted/30" />
              <div className="space-y-4">
                <div className="h-8 bg-muted/30 rounded w-3/4" />
                <div className="h-6 bg-muted/30 rounded w-1/4" />
                <div className="h-24 bg-muted/30 rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  const discount = product.original_price && product.original_price > product.price
    ? calculateDiscount(product.price, product.original_price)
    : 0;

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="aspect-square rounded-3xl overflow-hidden liquid-glass-card p-2">
                <div className="w-full h-full rounded-[1.25rem] overflow-hidden bg-muted/20">
                  {product.images?.[selectedImage] ? (
                    <img
                      src={product.images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                        selectedImage === index
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2 font-body">
                  {product.category}
                </p>
                <h1 className="font-display text-3xl md:text-4xl font-medium mb-5">
                  {product.name}
                </h1>
                
                <div className="space-y-1">
                  <p className="font-display text-2xl md:text-3xl font-medium text-foreground">
                    {formatInstallment(product.price, 3)}
                  </p>
                  <p className="font-body text-base text-muted-foreground">
                    ou {formatPrice(product.price)} à vista
                  </p>
                  {product.original_price && product.original_price > product.price && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-sm text-muted-foreground/60 line-through font-body">
                        de {formatPrice(product.original_price)}
                      </span>
                      <span className="status-badge status-badge-success">
                        -{discount}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="text-muted-foreground leading-relaxed font-body">
                  {product.description}
                </p>
              )}

              {/* Attributes/Variations */}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(product.attributes).map(([key, values]: [string, any]) => (
                    <div key={key}>
                      <label className="text-sm font-medium mb-2 block capitalize font-body">
                        {key}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(values) ? values.map((value: string) => (
                          <button
                            key={value}
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: value }))}
                            className={`px-4 py-2.5 rounded-full text-sm transition-all font-body ${
                              selectedAttributes[key] === value
                                ? 'glass-btn'
                                : 'glass-btn-secondary'
                            }`}
                          >
                            {value}
                          </button>
                        )) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="text-sm font-medium mb-3 block font-body">
                  Quantidade
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-11 h-11 rounded-full glass-btn-secondary flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-medium font-body">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-11 h-11 rounded-full glass-btn-secondary flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 text-sm font-body">
                {product.stock_quantity > 0 ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">Em estoque</span>
                  </>
                ) : (
                  <span className="text-destructive font-medium">Fora de estoque</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock_quantity === 0}
                  className="flex-1 glass-btn py-4 disabled:opacity-50"
                >
                  {addingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                </button>
                <button className="w-14 h-14 rounded-full glass-btn-secondary flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/30">
                <div className="text-center">
                  <div className="glass-icon w-12 h-12 mx-auto mb-3">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground font-body">Frete Grátis acima de R$299</p>
                </div>
                <div className="text-center">
                  <div className="glass-icon w-12 h-12 mx-auto mb-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground font-body">Pagamento Seguro</p>
                </div>
                <div className="text-center">
                  <div className="glass-icon w-12 h-12 mx-auto mb-3">
                    <RotateCcw className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground font-body">Troca em até 7 dias</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-24"
            >
              <h2 className="font-display text-2xl font-medium mb-10">Você também pode gostar</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((item) => (
                  <Link
                    key={item.id}
                    to={`/produto/${item.slug}`}
                    className="group"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden liquid-glass-card p-1 mb-4">
                      <div className="w-full h-full rounded-xl overflow-hidden bg-muted/20">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors font-body">
                      {item.name}
                    </h3>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-sm font-medium text-foreground font-body">
                        {formatInstallment(item.price, 3)}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        ou {formatPrice(item.price)} à vista
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Produto;