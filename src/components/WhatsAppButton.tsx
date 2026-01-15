import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { siteSettingsService } from "@/services/site-settings.service";

const WhatsAppButton = () => {
  const [phoneNumber, setPhoneNumber] = useState("5534999281320");
  const [brandName, setBrandName] = useState("Allura");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await siteSettingsService.getMultiple(['store_whatsapp', 'brand_name']);
    if (settings.store_whatsapp) {
      setPhoneNumber(settings.store_whatsapp.replace(/\D/g, ''));
    }
    if (settings.brand_name) {
      setBrandName(settings.brand_name);
    }
  };

  const message = `Olá! Gostaria de saber mais sobre os produtos ${brandName}.`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  if (!phoneNumber) return null;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </motion.a>
  );
};

export default WhatsAppButton;
