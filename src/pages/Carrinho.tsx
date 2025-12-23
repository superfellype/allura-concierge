import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatPrice } from "@/lib/payment/infinitepay-adapter";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  attributes: Record<string, string> | null;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[] | null;
    slug: string;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const _unused = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

const Carrinho = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          attributes,
          products (id, name, price, images, slug)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const items: CartItem[] = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        attributes: (item.attributes as Record<string, string>) || null,
        product: item.products as any
      })) || [];

      setCartItems(items);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      toast.error('Erro ao carregar carrinho');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdating(itemId);
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error: any) {
      toast.error('Erro ao atualizar quantidade');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items => items.filter(item => item.id !== itemId));
      toast.success('Item removido');
    } catch (error: any) {
      toast.error('Erro ao remover item');
    } finally {
      setUpdating(null);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const shipping = subtotal > 299 ? 0 : 19.90;
  const total = subtotal + shipping;

  if (!user) {
    return (
      <div className="min-h-screen bg-background noise-bg">
        <Navbar />
        <main className="pt-32 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="liquid-glass-card p-16"
            >
              <div className="glass-icon w-20 h-20 mx-auto mb-8">
                <ShoppingBag className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-display text-3xl mb-4">Seu Carrinho</h1>
              <p className="text-muted-foreground mb-10 font-body">
                Faça login para ver os itens do seu carrinho
              </p>
              <Link
                to="/login"
                className="glass-btn inline-flex items-center gap-2 px-8 py-4"
              >
                Fazer Login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
              Continuar Comprando
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-medium mb-10"
          >
            Seu Carrinho
          </motion.h1>

          {loading ? (
            <div className="liquid-glass-card p-16 text-center">
              <div className="animate-pulse font-body">Carregando...</div>
            </div>
          ) : cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="liquid-glass-card p-16 text-center"
            >
              <div className="glass-icon w-20 h-20 mx-auto mb-8">
                <ShoppingBag className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-display text-2xl mb-4">Carrinho vazio</h2>
              <p className="text-muted-foreground mb-10 font-body">
                Adicione peças incríveis ao seu carrinho
              </p>
              <Link to="/" className="glass-btn inline-flex items-center gap-2 px-8 py-4">
                Explorar Coleção
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      exit={{ opacity: 0, x: -100 }}
                      className="liquid-glass-card p-5 md:p-6"
                    >
                      <div className="flex gap-4 md:gap-6">
                        <Link
                          to={`/produto/${item.product.slug}`}
                          className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-muted/30"
                        >
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/produto/${item.product.slug}`}
                            className="font-display text-lg hover:text-primary transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>

                          {Object.keys(item.attributes || {}).length > 0 && (
                            <div className="mt-1 text-sm text-muted-foreground font-body">
                              {Object.entries(item.attributes).map(([key, value]) => (
                                <span key={key} className="mr-3">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="mt-3 text-xl font-medium text-primary font-body">
                            {formatPrice(item.product.price)}
                          </p>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={updating === item.id || item.quantity <= 1}
                                className="w-9 h-9 rounded-full glass-btn-secondary flex items-center justify-center disabled:opacity-50"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center font-medium font-body">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={updating === item.id}
                                className="w-9 h-9 rounded-full glass-btn-secondary flex items-center justify-center disabled:opacity-50"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={updating === item.id}
                              className="text-muted-foreground hover:text-destructive transition-colors p-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Order Summary */}
              <motion.div
                variants={itemVariants}
                className="lg:sticky lg:top-32"
              >
                <div className="liquid-glass-card p-8">
                  <h2 className="font-display text-xl mb-8">Resumo do Pedido</h2>

                  <div className="space-y-4 mb-8 font-body">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frete</span>
                      <span>
                        {shipping === 0 ? (
                          <span className="status-badge status-badge-success">Grátis</span>
                        ) : (
                          formatPrice(shipping)
                        )}
                      </span>
                    </div>
                    {subtotal < 299 && (
                      <p className="text-xs text-muted-foreground">
                        Frete grátis em compras acima de R$ 299
                      </p>
                    )}
                    <div className="glass-divider" />
                    <div className="flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span className="glass-kpi text-2xl">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full glass-btn py-4"
                  >
                    Finalizar Compra
                  </button>

                  <p className="mt-6 text-xs text-center text-muted-foreground font-body">
                    Pagamento seguro via InfinitePay
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Carrinho;