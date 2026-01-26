import { Instagram, MessageCircle } from "lucide-react";
import logoFlower from "@/assets/logo-allura-flower.png";

const VitrineFooter = () => {
  return (
    <footer className="py-16 bg-vitrine-charcoal text-vitrine-cream/80">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <img 
            src={logoFlower} 
            alt="Allura" 
            className="w-10 h-10 object-contain opacity-60 mb-8"
          />

          {/* Social Links */}
          <div className="flex items-center gap-6 mb-8">
            <a
              href="https://instagram.com/allura"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-vitrine-cream/50 hover:text-vitrine-cream transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
              <span className="hidden sm:inline">Instagram</span>
            </a>
            <span className="w-px h-4 bg-vitrine-cream/20" />
            <a
              href="https://wa.me/5534999281320"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-vitrine-cream/50 hover:text-vitrine-cream transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>

          {/* Location */}
          <p className="text-xs text-vitrine-cream/30 tracking-wider">
            Uberlândia, MG — Brasil
          </p>

          {/* Copyright */}
          <p className="text-xs text-vitrine-cream/20 mt-6">
            © {new Date().getFullYear()} Allura. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default VitrineFooter;
