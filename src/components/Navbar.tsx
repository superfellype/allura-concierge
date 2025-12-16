import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, ShoppingBag, User, LogOut } from "lucide-react";
import logoAllura from "@/assets/logo-allura-text.png";
import logoFlower from "@/assets/logo-allura-flower.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { name: "Coleções", href: "/produtos" },
  { name: "Bolsas", href: "/produtos?categoria=bolsas" },
  { name: "Acessórios", href: "/produtos?categoria=acessorios" },
  { name: "Sobre", href: "/sobre" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch cart count
  useEffect(() => {
    if (user) {
      fetchCartCount();
      
      // Subscribe to cart changes
      const channel = supabase
        .channel('cart-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchCartCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setCartCount(0);
    }
  }, [user]);

  const fetchCartCount = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(total);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "liquid-glass py-3"
            : "bg-transparent py-5"
        }`}
      >
        <nav className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="relative z-10 flex items-center gap-2"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2"
            >
              <img 
                src={logoFlower} 
                alt="" 
                className="h-8 w-auto"
              />
              <img 
                src={logoAllura} 
                alt="Allura" 
                className="h-8 md:h-10 w-auto"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <Link
                  to={link.href}
                  className="link-elegant font-body text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 text-foreground/70 hover:text-primary transition-colors liquid-glass rounded-full"
              aria-label="Buscar"
            >
              <Search className="w-4 h-4" />
            </motion.button>

            {/* User Account */}
            <Link to={user ? "/minha-conta" : "/login"}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex p-2.5 text-foreground/70 hover:text-primary transition-colors liquid-glass rounded-full"
                aria-label={user ? "Minha conta" : "Entrar"}
              >
                <User className="w-4 h-4" />
              </motion.button>
            </Link>

            {/* Cart */}
            <Link to="/carrinho">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2.5 text-foreground/70 hover:text-primary transition-colors liquid-glass rounded-full"
                aria-label="Sacola de compras"
              >
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </motion.button>
            </Link>

            {/* Mobile Menu Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 text-foreground liquid-glass rounded-full ml-2"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-foreground/10 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 right-0 h-full w-80 max-w-[90vw] liquid-glass p-8 pt-24"
              style={{ backdropFilter: 'blur(60px) saturate(200%)' }}
            >
              <div className="flex flex-col gap-6">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-display text-2xl font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-8 pt-8 border-t border-border/50 space-y-4">
                  {user ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Link
                          to="/minha-conta"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 text-foreground/70 hover:text-primary transition-colors"
                        >
                          <User className="w-5 h-5" />
                          <span className="font-body">Minha Conta</span>
                        </Link>
                      </motion.div>
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        onClick={handleSignOut}
                        className="flex items-center gap-3 text-foreground/70 hover:text-destructive transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-body">Sair</span>
                      </motion.button>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-foreground/70 hover:text-primary transition-colors"
                      >
                        <User className="w-5 h-5" />
                        <span className="font-body">Entrar</span>
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
