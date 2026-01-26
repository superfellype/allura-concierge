const VitrineManifesto = () => {
  return (
    <section className="py-24 md:py-32 bg-vitrine-cream">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl font-light text-vitrine-charcoal leading-relaxed tracking-tight">
            "Cada peça carrega a textura do couro brasileiro, 
            <br className="hidden md:block" />
            a precisão do artesanato e a sutileza do design consciente."
          </blockquote>
          
          <div className="mt-12 flex items-center justify-center gap-4">
            <span className="w-8 h-px bg-vitrine-charcoal/20" />
            <span className="text-xs tracking-[0.3em] uppercase text-vitrine-charcoal/40">
              Allura
            </span>
            <span className="w-8 h-px bg-vitrine-charcoal/20" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default VitrineManifesto;
