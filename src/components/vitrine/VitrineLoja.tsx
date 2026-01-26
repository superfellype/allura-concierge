import { motion } from "framer-motion";
import { MapPin, MessageCircle } from "lucide-react";

const VitrineLoja = () => {
  const whatsappUrl = "https://wa.me/5534999281320?text=Olá! Gostaria de conhecer mais sobre a Allura.";
  const mapsUrl = "https://maps.google.com/?q=R.+Cel.+Severiano,+525+Tabajaras+Uberlândia+MG";

  return (
    <section id="sobre" className="py-24 md:py-32 lg:py-40 bg-vitrine-surface">
      <div className="max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Image */}
          <motion.div
            className="aspect-[4/5] overflow-hidden order-2 lg:order-1"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2670&auto=format&fit=crop"
              alt="Nossa loja"
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Content */}
          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal text-vitrine-text tracking-[0.02em] leading-[1.2] mb-8">
              Visite nossa loja
            </h3>

            <p className="font-sans text-base leading-[1.7] text-vitrine-text-secondary max-w-md mb-10">
              Conheça de perto cada detalhe das nossas peças. Nosso espaço foi 
              pensado para proporcionar uma experiência sensorial única com o 
              couro brasileiro.
            </p>

            {/* Location */}
            <div className="flex items-start gap-3 mb-8">
              <MapPin className="w-5 h-5 text-vitrine-text/50 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-sm text-vitrine-text">
                  R. Cel. Severiano, 525 – Tabajaras
                </p>
                <p className="text-sm text-vitrine-text-secondary">
                  Uberlândia – MG, 38400-228
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-vitrine-text text-vitrine-surface text-[13px] tracking-[0.12em] uppercase hover:opacity-80 transition-opacity duration-300"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                WhatsApp
              </a>
              
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-vitrine-text text-vitrine-text text-[13px] tracking-[0.12em] uppercase hover:bg-vitrine-text hover:text-vitrine-surface transition-all duration-300"
              >
                <MapPin className="w-4 h-4" strokeWidth={1.5} />
                Como chegar
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VitrineLoja;
