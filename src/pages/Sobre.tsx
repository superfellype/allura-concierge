import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logoFlower from "@/assets/logo-allura-flower.png";

const Sobre = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />
          
          <div className="relative z-10 container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="flex justify-center mb-6">
                <img src={logoFlower} alt="" className="w-12 h-12 object-contain" />
              </div>
              <span className="font-body text-xs uppercase tracking-[0.25em] text-primary/80">
                Nossa Essência
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium mt-4 tracking-tight">
                Design que flui<br />com você
              </h1>
              <p className="font-body text-lg text-muted-foreground mt-6 leading-relaxed">
                Allura nasceu do desejo de criar peças que acompanham os momentos reais da vida moderna. Cada bolsa é pensada com intenção, combinando funcionalidade e beleza em equilíbrio perfeito.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="font-body text-xs uppercase tracking-[0.25em] text-primary/80">
                O que nos move
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-medium mt-4">
                Menos excesso. Mais intenção.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Materiais Nobres",
                  description: "Trabalhamos exclusivamente com couro premium, selecionado por sua durabilidade e beleza natural que só melhora com o tempo."
                },
                {
                  title: "Produção Consciente",
                  description: "Cada peça é produzida em pequenas quantidades, garantindo atenção aos detalhes e reduzindo desperdícios."
                },
                {
                  title: "Design Atemporal",
                  description: "Criamos pensando no longo prazo. Peças que transcendem tendências e se tornam companheiras de jornada."
                }
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="liquid-card p-8 text-center"
                >
                  <h3 className="font-display text-xl font-medium mb-4">{value.title}</h3>
                  <p className="font-body text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Quote */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/30 via-transparent to-secondary/30" />
          <div className="relative z-10 container mx-auto px-6">
            <motion.blockquote
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className="font-display text-2xl md:text-3xl lg:text-4xl font-medium italic text-foreground/90 leading-relaxed">
                "Um novo significado em cada escolha."
              </p>
              <footer className="mt-6 font-body text-sm text-muted-foreground">
                — Filosofia Allura
              </footer>
            </motion.blockquote>
          </div>
        </section>

        {/* Location */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="liquid-card p-8 md:p-12 max-w-2xl mx-auto text-center"
            >
              <span className="font-body text-xs uppercase tracking-[0.25em] text-primary/80">
                Onde nos encontrar
              </span>
              <h3 className="font-display text-2xl font-medium mt-4 mb-6">
                Uberlândia, MG
              </h3>
              <p className="font-body text-muted-foreground mb-2">
                R. Cel. Severiano, 525 – Tabajaras
              </p>
              <p className="font-body text-muted-foreground mb-6">
                CEP 38400-228
              </p>
              <a 
                href="https://wa.me/5534999281320" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 liquid-button px-6 py-3 text-primary-foreground font-body text-sm"
              >
                Fale conosco
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sobre;
