import { motion } from "framer-motion";
import VitrineHero from "@/components/vitrine/VitrineHero";
import VitrineManifesto from "@/components/vitrine/VitrineManifesto";
import VitrineProdutos from "@/components/vitrine/VitrineProdutos";
import VitrineLoja from "@/components/vitrine/VitrineLoja";
import VitrineFooter from "@/components/vitrine/VitrineFooter";
import VitrineNav from "@/components/vitrine/VitrineNav";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Vitrine = () => {
  return (
    <div className="min-h-screen bg-vitrine-cream text-vitrine-charcoal antialiased">
      <VitrineNav />
      
      <main>
        <VitrineHero />
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <VitrineManifesto />
        </motion.div>
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <VitrineProdutos />
        </motion.div>
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <VitrineLoja />
        </motion.div>
      </main>
      
      <VitrineFooter />
    </div>
  );
};

export default Vitrine;
