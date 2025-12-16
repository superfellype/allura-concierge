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

      // Fetch related products
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
      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Add new item
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse grid md:grid-cols-2 gap-12">
              <div className="aspect-square rounded-3xl bg-muted" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/4" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
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
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
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
              <div className="aspect-square rounded-3xl overflow-hidden liquid-glass p-2">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-muted">
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
                          ? 'border-primary'
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
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                  {product.category}
                </p>
                <h1 className="text-3xl md:text-4xl font-serif mb-4">
                  {product.name}
                </h1>
                
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-medium text-primary">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(product.original_price)}
                      </span>
                      <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        -{discount}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Attributes/Variations */}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(product.attributes).map(([key, values]: [string, any]) => (
                    <div key={key}>
                      <label className="text-sm font-medium mb-2 block capitalize">
                        {key}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(values) ? values.map((value: string) => (
                          <button
                            key={value}
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [key]: value }))}
                            className={`px-4 py-2 rounded-full text-sm transition-all ${
                              selectedAttributes[key] === value
                                ? 'bg-primary text-primary-foreground'
                                : 'glass-button'
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
                <label className="text-sm font-medium mb-2 block">
                  Quantidade
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-full glass-button flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-lg font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 rounded-full glass-button flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 text-sm">
                {product.stock_quantity > 0 ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Em estoque</span>
                  </>
                ) : (
                  <span className="text-destructive">Fora de estoque</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock_quantity === 0}
                  className="flex-1 liquid-button py-4 disabled:opacity-50"
                >
                  {addingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                </button>
                <button className="w-14 h-14 rounded-full glass-button flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Frete Grátis acima de R$299</p>
                </div>
                <div className="text-center">
                  <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Pagamento Seguro</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Troca em até 7 dias</p>
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
              className="mt-20"
            >
              <h2 className="text-2xl font-serif mb-8">Você também pode gostar</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedProducts.map((item) => (
                  <Link
                    key={item.id}
                    to={`/produto/${item.slug}`}
                    className="group"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
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
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-primary font-medium mt-1">
                      {formatPrice(item.price)}
                    </p>
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
