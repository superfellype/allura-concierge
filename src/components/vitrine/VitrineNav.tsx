import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Instagram, MapPin } from "lucide-react";

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
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-vitrine-bg/95 backdrop-blur-md" 
          : "bg-transparent"
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <nav className="max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24">
        <div className="flex items-center justify-between h-20">
          {/* Left - Social Icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/allura"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vitrine-text/60 hover:text-vitrine-text transition-opacity duration-300"
              aria-label="Instagram"
            >
              <Instagram className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </a>
            <a
              href="https://maps.google.com/?q=R.+Cel.+Severiano,+525+Uberlândia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vitrine-text/60 hover:text-vitrine-text transition-opacity duration-300"
              aria-label="Localização"
            >
              <MapPin className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </a>
          </div>

          {/* Center - Brand Name */}
          <Link 
            to="/vitrine" 
            className="absolute left-1/2 -translate-x-1/2"
          >
            <h1 className="font-serif text-2xl md:text-3xl font-normal tracking-[0.02em] text-vitrine-text">
              Allura
            </h1>
          </Link>

          {/* Right - Navigation Links */}
          <div className="flex items-center gap-8">
            <Link
              to="/vitrine"
              className="hidden md:block text-[13px] tracking-[0.02em] text-vitrine-text/70 hover:text-vitrine-text transition-colors duration-300"
            >
              Loja
            </Link>
            <Link
              to="/vitrine#sobre"
              className="hidden md:block text-[13px] tracking-[0.02em] text-vitrine-text/70 hover:text-vitrine-text transition-colors duration-300"
            >
              Sobre
            </Link>
            <a
              href="https://wa.me/5534999281320"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] tracking-[0.02em] text-vitrine-text/70 hover:text-vitrine-text transition-colors duration-300"
            >
              Contato
            </a>
          </div>
        </div>
      </nav>
    </motion.header>
  );
};

export default VitrineNav;
