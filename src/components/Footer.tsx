import { motion } from "framer-motion";
import { Heart, Instagram, Mail, MapPin, Phone } from "lucide-react";
import logoAllura from "@/assets/logo-allura-text.png";
import logoBadge from "@/assets/logo-allura-badge.png";
const footerLinks = {
  shop: [{
    name: "Todas as Bolsas",
    href: "#"
  }, {
    name: "Totes",
    href: "#"
  }, {
    name: "Clutches",
    href: "#"
  }, {
    name: "Acessórios",
    href: "#"
  }, {
    name: "Novidades",
    href: "#"
  }],
  about: [{
    name: "Nossa História",
    href: "#"
  }, {
    name: "Artesanato",
    href: "#"
  }, {
    name: "Sustentabilidade",
    href: "#"
  }, {
    name: "Imprensa",
    href: "#"
  }],
  help: [{
    name: "FAQ",
    href: "#"
  }, {
    name: "Envio e Entregas",
    href: "#"
  }, {
    name: "Trocas e Devoluções",
    href: "#"
  }, {
    name: "Cuidados com Couro",
    href: "#"
  }]
};
const Footer = () => {
  return <footer className="relative bg-foreground text-primary-foreground overflow-hidden">
      {/* Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }}>
              <div className="flex items-center gap-3 mb-4">
                <img src={logoBadge} alt="" className="h-12 w-auto brightness-0 invert opacity-100" />
                
              </div>
              <p className="font-body text-primary-foreground/70 max-w-sm">
                Desde 2012, transformamos couro brasileiro premium em peças atemporais que contam histórias de elegância e sofisticação.
              </p>

              {/* Contact Info */}
              <div className="mt-8 space-y-3">
                <a className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-primary transition-colors" href="tel:+5534999281320">
                  <Phone className="w-4 h-4" />
                  +55 (34) 99928-1320    
                </a>
                <a href="mailto:contato@allura.com.br" className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                  contato@allura.com.br
                </a>
                <div className="flex items-center gap-3 text-sm text-primary-foreground/70">
                  <MapPin className="w-4 h-4" />
                  São Paulo, Brasil
                </div>
              </div>

              {/* Social */}
              <div className="flex gap-4 mt-8">
                <motion.a whileHover={{
                scale: 1.1,
                y: -2
              }} href="#" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                  <Instagram className="w-5 h-5" />
                </motion.a>
              </div>
            </motion.div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-6">
              Comprar
            </h3>
            <ul className="space-y-3">
              {footerLinks.shop.map(link => <li key={link.name}>
                  <a href={link.href} className="font-body text-sm text-primary-foreground/70 hover:text-primary transition-colors">
                    {link.name}
                  </a>
                </li>)}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-6">
              Sobre
            </h3>
            <ul className="space-y-3">
              {footerLinks.about.map(link => <li key={link.name}>
                  <a href={link.href} className="font-body text-sm text-primary-foreground/70 hover:text-primary transition-colors">
                    {link.name}
                  </a>
                </li>)}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-6">
              Ajuda
            </h3>
            <ul className="space-y-3">
              {footerLinks.help.map(link => <li key={link.name}>
                  <a href={link.href} className="font-body text-sm text-primary-foreground/70 hover:text-primary transition-colors">
                    {link.name}
                  </a>
                </li>)}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="mt-16 pt-12 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-xl font-medium">
                Receba novidades exclusivas
              </h3>
              <p className="font-body text-sm text-primary-foreground/70 mt-1">
                Seja a primeira a conhecer novas coleções e ofertas especiais.
              </p>
            </div>
            <div className="flex w-full md:w-auto">
              <input type="email" placeholder="Seu melhor e-mail" className="flex-1 md:w-64 px-5 py-3 bg-primary-foreground/10 border border-primary-foreground/20 rounded-l-full font-body text-sm placeholder:text-primary-foreground/40 focus:outline-none focus:border-primary transition-colors" />
              <button className="px-6 py-3 bg-primary text-primary-foreground font-body font-medium text-sm rounded-r-full hover:bg-primary/90 transition-colors">
                Inscrever
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-primary-foreground/50">
            © 2024 Allura. Todos os direitos reservados.
          </p>
          <p className="font-body text-xs text-primary-foreground/50 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-primary" /> em Uberlândia.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;