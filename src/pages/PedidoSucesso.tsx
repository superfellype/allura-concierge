import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight, Home, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatPrice } from "@/lib/payment/infinitepay-adapter";

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  shipping_address: {
    street?: string;
    number?: string;
    city?: string;
    state?: string;
  } | null;
}

const PedidoSucesso = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      // Update order status to pending_payment (since user completed checkout flow)
      updateOrderStatus();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total, created_at, shipping_address')
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      setOrder(data as Order | null);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    try {
      // Only update if status is still 'created'
      await supabase
        .from('orders')
        .update({ status: 'pending_payment' })
        .eq('id', orderId)
        .eq('status', 'created');
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100/50 to-secondary/20 noise-bg">
      <Navbar />
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-morph" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl animate-morph" style={{ animationDelay: "-4s" }} />
      </div>
      
      <main className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="liquid-glass-card p-8 md:p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 rounded-full bg-green-100/80 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-serif mb-4"
            >
              Pedido Realizado!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-8"
            >
              Obrigado pela sua compra. Você receberá um email com os detalhes do pedido.
            </motion.p>

            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted/50 rounded w-1/2 mx-auto" />
                <div className="h-4 bg-muted/50 rounded w-1/3 mx-auto" />
              </div>
            ) : order ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6"
              >
                <div className="bg-muted/20 backdrop-blur-sm rounded-2xl p-6 text-left space-y-4 border border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Número do Pedido</span>
                    <span className="font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="glass-kpi text-xl">{formatPrice(order.total)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="status-badge status-badge-warning">
                      <Clock className="w-3 h-3" />
                      Aguardando Pagamento
                    </span>
                  </div>

                  <div className="glass-divider" />

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Entregar em:</p>
                    <p className="text-sm">
                      {order.shipping_address?.street}, {order.shipping_address?.number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.shipping_address?.city} - {order.shipping_address?.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>Envio via Correios em até 7 dias úteis</span>
                </div>
              </motion.div>
            ) : (
              <p className="text-muted-foreground">
                Não foi possível carregar os detalhes do pedido.
              </p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
            >
              <Link
                to="/minha-conta"
                className="glass-btn-secondary px-6 py-3 inline-flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                Meus Pedidos
              </Link>
              <Link
                to="/"
                className="glass-btn px-6 py-3 inline-flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Continuar Comprando
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PedidoSucesso;
