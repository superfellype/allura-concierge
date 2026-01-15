import { motion } from "framer-motion";
import { Truck, Shield, RefreshCw, MessageCircle, CreditCard, Gift, Heart, Star, Clock, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { siteSettingsService, BenefitItem } from "@/services/site-settings.service";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Truck,
  Shield,
  RefreshCw,
  MessageCircle,
  CreditCard,
  Gift,
  Heart,
  Star,
  Clock,
  Award,
};

const defaultBenefits: BenefitItem[] = [
  { icon: "Truck", title: "Frete Grátis", description: "Para compras acima de R$ 299" },
  { icon: "Shield", title: "Garantia Vitalícia", description: "Qualidade que dura para sempre" },
  { icon: "RefreshCw", title: "Troca Facilitada", description: "30 dias para trocar ou devolver" },
  { icon: "MessageCircle", title: "Atendimento Exclusivo", description: "WhatsApp direto com nossa equipe" },
];

const BenefitsSection = () => {
  const [benefits, setBenefits] = useState<BenefitItem[]>(defaultBenefits);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await siteSettingsService.getMultiple(['benefits', 'benefits_enabled']);
      
      if (settings.benefits && Array.isArray(settings.benefits) && settings.benefits.length > 0) {
        setBenefits(settings.benefits);
      }
      
      if (settings.benefits_enabled !== undefined) {
        setEnabled(settings.benefits_enabled);
      }
    } catch (error) {
      console.error('Error loading benefits settings:', error);
    }
    setLoading(false);
  };

  if (!enabled || loading) return null;

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="relative z-10 container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = iconMap[benefit.icon] || Star;
            return (
              <motion.div
                key={`${benefit.title}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="text-center group"
              >
                {/* Icon Container */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="glass-icon w-16 h-16 mx-auto mb-4 group-hover:shadow-glow transition-all duration-300"
                >
                  <IconComponent className="w-7 h-7 text-primary" />
                </motion.div>
                
                {/* Text */}
                <h3 className="font-display text-sm md:text-base font-medium mb-1 group-hover:text-primary transition-colors">
                  {benefit.title}
                </h3>
                <p className="font-body text-xs md:text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
