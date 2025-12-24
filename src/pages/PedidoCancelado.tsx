import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, ShoppingBag, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PedidoCancelado = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100/50 to-secondary/20 noise-bg">
      <Navbar />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-red-500/5 rounded-full blur-3xl animate-morph" />
        <div className="absolute bottom-[30%] right-[20%] w-[300px] h-[300px] bg-accent/5 rounded-full blur-3xl animate-morph" style={{ animationDelay: "-3s" }} />
      </div>
      
      <main className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="liquid-glass-card p-8 md:p-12"
          >
            {/* Cancel Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center"
            >
              <XCircle className="w-10 h-10 text-red-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-serif mb-4"
            >
              Pagamento Cancelado
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground mb-8"
            >
              O pagamento foi cancelado. Seu pedido ainda está salvo e você pode tentar novamente.
            </motion.p>

            {orderId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8 p-4 bg-muted/30 rounded-xl"
              >
                <p className="text-sm text-muted-foreground">Número do Pedido</p>
                <p className="font-mono text-sm">{orderId.slice(0, 8).toUpperCase()}</p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Link to="/checkout" className="block">
                <Button className="w-full glass-btn">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </Link>
              
              <Link to="/carrinho" className="block">
                <Button variant="outline" className="w-full glass-btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Carrinho
                </Button>
              </Link>

              <Link to="/produtos" className="block">
                <Button variant="ghost" className="w-full">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continuar Comprando
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PedidoCancelado;
