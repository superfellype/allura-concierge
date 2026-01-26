import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logoText from "@/assets/logo-allura-text.png";

const VitrineNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-vitrine-cream/95 backdrop-blur-md py-4" 
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/vitrine" className="block">
          <img 
            src={logoText} 
            alt="Allura" 
            className="h-6 md:h-7 object-contain opacity-90"
          />
        </Link>

        <a
          href="https://wa.me/5534999281320"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.2em] uppercase text-vitrine-charcoal/70 hover:text-vitrine-charcoal transition-colors"
        >
          Contato
        </a>
      </div>
    </motion.nav>
  );
};

export default VitrineNav;
