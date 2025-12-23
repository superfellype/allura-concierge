import { motion } from "framer-motion";
import { Heart, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logoBadge from "@/assets/logo-allura-badge.png";

const footerLinks = {
  shop: [
    { name: "Todas as Bolsas", href: "/produtos" },
    { name: "Totes", href: "/produtos?categoria=totes" },
    { name: "Clutches", href: "/produtos?categoria=clutches" },
    { name: "Acessórios", href: "/produtos?categoria=acessorios" },
    { name: "Novidades", href: "/produtos" },
  ],
  about: [
    { name: "Nossa História", href: "/sobre" },
    { name: "Artesanato", href: "/sobre" },
    { name: "Sustentabilidade", href: "/sobre" },
    { name: "Imprensa", href: "/sobre" },
  ],
  help: [
    { name: "FAQ", href: "/sobre" },
    { name: "Envio e Entregas", href: "/sobre" },
    { name: "Trocas e Devoluções", href: "/sobre" },
    { name: "Cuidados com Couro", href: "/sobre" },
  ],
};

const Footer = () => {
  return (
    <footer className="relative bg-foreground text-primary-foreground overflow-hidden">
      {/* Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logoBadge}
                  alt=""
                  className="h-12 w-auto brightness-0 invert opacity-80"
                />
              </div>
              <p className="font-body text-primary-foreground/70 max-w-sm">
                Escolhas pensadas para você, do primeiro clique ao último detalhe.
              </p>

              {/* Contact Info */}
              <div className="mt-8 space-y-3">
                <a
                  className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-primary transition-colors group"
                  href="tel:+5534999281320"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-4 h-4" />
                  </span>
                  +55 (34) 99928-1320
                </a>
                <a
                  className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-primary transition-colors group"
                  href="mailto:contato@allura.com"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-4 h-4" />
                  </span>
                  contato@allura.com
                </a>
                <div className="flex items-center gap-3 text-sm text-primary-foreground/70">
                  <span className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </span>
                  Uberlândia - MG, Brasil
                </div>
              </div>

              {/* Social */}
              <div className="flex gap-3 mt-8">
                <motion.a
                  whileHover={{ scale: 1.1, y: -2 }}
                  href="https://instagram.com/comallura"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-primary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:shadow-glow"
                >
                  <Instagram className="w-5 h-5" />
                </motion.a>
              </div>
            </motion.div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-6 text-primary-foreground/90">
              Comprar
            </h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-primary-foreground/60 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-6 text-primary-foreground/90">
              Sobre
            </h3>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-primary-foreground/60 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-6 text-primary-foreground/90">
              Ajuda
            </h3>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-primary-foreground/60 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 pt-12 border-t border-primary-foreground/10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-xl font-medium">
                Receba novidades exclusivas
              </h3>
              <p className="font-body text-sm text-primary-foreground/60 mt-1">
                Seja a primeira a conhecer novas coleções e ofertas especiais.
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 md:w-64 px-5 py-3 bg-primary-foreground/10 border border-primary-foreground/20 rounded-l-xl font-body text-sm placeholder:text-primary-foreground/40 focus:outline-none focus:border-primary transition-colors backdrop-blur-sm"
              />
              <button className="px-6 py-3 bg-primary text-primary-foreground font-body font-medium text-sm rounded-r-xl hover:bg-primary/90 transition-colors shadow-lg hover:shadow-glow">
                Inscrever
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-primary-foreground/40">
            © 2024 Allura. Todos os direitos reservados.
          </p>
          <p className="font-body text-xs text-primary-foreground/40 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-primary animate-pulse" /> em Uberlândia.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
