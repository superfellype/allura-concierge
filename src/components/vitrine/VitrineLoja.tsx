import { MapPin, Clock, ExternalLink } from "lucide-react";

const VitrineLoja = () => {
  const address = "R. Cel. Severiano, 525 – Tabajaras, Uberlândia – MG, 38400-228";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <section className="py-24 md:py-32 bg-vitrine-cream">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs tracking-[0.3em] uppercase text-vitrine-charcoal/40 block mb-6">
            Visite-nos
          </span>

          <h2 className="font-serif text-3xl md:text-4xl font-light text-vitrine-charcoal mb-12">
            Nossa Loja
          </h2>

          <div className="space-y-8">
            {/* Address */}
            <div className="flex flex-col items-center gap-3">
              <MapPin className="w-5 h-5 text-vitrine-charcoal/30" />
              <p className="text-vitrine-charcoal/70 leading-relaxed">
                R. Cel. Severiano, 525 – Tabajaras
                <br />
                Uberlândia – MG, 38400-228
              </p>
            </div>

            {/* Hours */}
            <div className="flex flex-col items-center gap-3">
              <Clock className="w-5 h-5 text-vitrine-charcoal/30" />
              <p className="text-vitrine-charcoal/70">
                Seg – Sex: 9h às 18h
                <br />
                Sáb: 9h às 13h
              </p>
            </div>

            {/* Maps CTA */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-sm tracking-[0.15em] uppercase text-vitrine-charcoal/60 hover:text-vitrine-charcoal transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir no Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VitrineLoja;
