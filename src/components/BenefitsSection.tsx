import { motion } from "framer-motion";
import { Truck, Shield, RefreshCw, MessageCircle } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Frete Grátis",
    description: "Para compras acima de R$ 299",
  },
  {
    icon: Shield,
    title: "Garantia Vitalícia",
    description: "Qualidade que dura para sempre",
  },
  {
    icon: RefreshCw,
    title: "Troca Facilitada",
    description: "30 dias para trocar ou devolver",
  },
  {
    icon: MessageCircle,
    title: "Atendimento Exclusivo",
    description: "WhatsApp direto com nossa equipe",
  },
];

const BenefitsSection = () => {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/20" />
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-sm font-medium mb-1">{benefit.title}</h3>
              <p className="font-body text-xs text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
