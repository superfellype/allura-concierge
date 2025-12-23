import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl"
        />
      </div>

      {/* Noise Overlay */}
      <div className="noise-bg" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center px-6"
      >
        <div className="liquid-glass-card p-12 md:p-16 rounded-3xl max-w-lg mx-auto">
          {/* 404 Number */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="mb-6"
          >
            <span className="glass-kpi text-7xl md:text-8xl font-display font-bold bg-gradient-to-br from-primary via-accent to-primary bg-clip-text text-transparent">
              404
            </span>
          </motion.div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
            className="glass-icon w-20 h-20 mx-auto mb-6"
          >
            <Search className="w-8 h-8 text-primary" />
          </motion.div>

          {/* Text */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-display text-2xl md:text-3xl font-medium mb-3"
          >
            Página não encontrada
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="font-body text-muted-foreground mb-8"
          >
            O endereço que você procura não existe ou foi movido.
          </motion.p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-btn px-6 py-3 rounded-xl font-body font-medium flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Voltar ao início
              </motion.button>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="glass-btn-secondary px-6 py-3 rounded-xl font-body font-medium flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Página anterior
            </button>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full blur-sm"
        />
      </motion.div>
    </div>
  );
};

export default NotFound;
