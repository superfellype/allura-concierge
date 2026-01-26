import { Link } from "react-router-dom";
import { Instagram, MessageCircle, MapPin } from "lucide-react";

const VitrineFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 md:py-20 bg-vitrine-bg border-t border-vitrine-border">
      <div className="max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24">
        {/* Main Footer Content - Centered */}
        <div className="text-center">
          {/* Brand */}
          <Link to="/vitrine" className="inline-block mb-8">
            <span className="font-serif text-2xl font-normal tracking-[0.02em] text-vitrine-text">
              Allura
            </span>
          </Link>

          {/* Social Icons */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <a
              href="https://instagram.com/allura"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vitrine-text/50 hover:text-vitrine-text transition-colors duration-300"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" strokeWidth={1.5} />
            </a>
            <a
              href="https://wa.me/5534999281320"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vitrine-text/50 hover:text-vitrine-text transition-colors duration-300"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
            </a>
            <a
              href="https://maps.google.com/?q=R.+Cel.+Severiano,+525+Uberlândia"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vitrine-text/50 hover:text-vitrine-text transition-colors duration-300"
              aria-label="Localização"
            >
              <MapPin className="w-5 h-5" strokeWidth={1.5} />
            </a>
          </div>

          {/* Location */}
          <p className="text-[13px] text-vitrine-text-secondary mb-2">
            R. Cel. Severiano, 525 – Tabajaras
          </p>
          <p className="text-[13px] text-vitrine-text-secondary mb-8">
            Uberlândia – MG
          </p>

          {/* Copyright */}
          <p className="text-[12px] text-vitrine-text/40">
            © {currentYear} Allura. Feito com ❤️ em Uberlândia.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default VitrineFooter;
