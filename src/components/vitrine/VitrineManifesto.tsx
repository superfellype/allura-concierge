import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const VitrineManifesto = () => {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-vitrine-bg">
      <div className="max-w-[1440px] mx-auto px-5 md:px-12 lg:px-24">
        <motion.div
          className="max-w-[680px] mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-sans text-base md:text-lg leading-[1.7] text-vitrine-text-secondary tracking-normal">
            Criamos bolsas e acessórios em couro premium brasileiro, com foco em 
            designs atemporais, produção artesanal e materiais de origem responsável.
          </p>

          <Link
            to="/vitrine#sobre"
            className="inline-block mt-10 text-[13px] tracking-[0.12em] uppercase text-vitrine-text/70 hover:text-vitrine-text transition-colors duration-300"
          >
            Nossa história
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default VitrineManifesto;
