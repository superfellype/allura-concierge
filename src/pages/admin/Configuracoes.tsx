import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Store, Truck, CreditCard } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Configuracoes = () => {
  const [storeSettings, setStoreSettings] = useState({
    storeName: "Allura",
    email: "contato@allura.com.br",
    phone: "(34) 9 9928-1320",
    address: "R. Cel. Severiano, 525 – Tabajaras, Uberlândia – MG",
    whatsapp: "5534999281320",
  });

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingMinimum: "299",
    defaultShippingCost: "19.90",
    estimatedDays: "5-10",
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Configurações salvas!");
    setSaving(false);
  };

  return (
    <AdminLayout title="Configurações">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl space-y-6"
      >
        {/* Store Info - Liquid Glass */}
        <motion.div variants={itemVariants} className="liquid-glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="glass-icon glass-icon-md">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-medium">Informações da Loja</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                Nome da Loja
              </label>
              <input
                type="text"
                value={storeSettings.storeName}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                className="glass-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                  E-mail
                </label>
                <input
                  type="email"
                  value={storeSettings.email}
                  onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                  Telefone
                </label>
                <input
                  type="text"
                  value={storeSettings.phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                  className="glass-input"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                Endereço
              </label>
              <input
                type="text"
                value={storeSettings.address}
                onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                className="glass-input"
              />
            </div>

            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                WhatsApp (número completo com DDD)
              </label>
              <input
                type="text"
                value={storeSettings.whatsapp}
                onChange={(e) => setStoreSettings({ ...storeSettings, whatsapp: e.target.value })}
                className="glass-input"
              />
            </div>
          </div>
        </motion.div>

        {/* Shipping - Liquid Glass */}
        <motion.div variants={itemVariants} className="liquid-glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="glass-icon glass-icon-md" style={{ background: 'linear-gradient(135deg, hsl(210 80% 50% / 0.15), hsl(210 80% 50% / 0.05))' }}>
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-display text-xl font-medium">Frete e Entrega</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                  Frete grátis acima de (R$)
                </label>
                <input
                  type="number"
                  value={shippingSettings.freeShippingMinimum}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingMinimum: e.target.value })}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                  Custo padrão de frete (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={shippingSettings.defaultShippingCost}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, defaultShippingCost: e.target.value })}
                  className="glass-input"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                Prazo estimado de entrega (dias úteis)
              </label>
              <input
                type="text"
                value={shippingSettings.estimatedDays}
                onChange={(e) => setShippingSettings({ ...shippingSettings, estimatedDays: e.target.value })}
                className="glass-input"
              />
            </div>
          </div>
        </motion.div>

        {/* Payment Info - Liquid Glass */}
        <motion.div variants={itemVariants} className="liquid-glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="glass-icon glass-icon-md" style={{ background: 'linear-gradient(135deg, hsl(142 70% 45% / 0.15), hsl(142 70% 45% / 0.05))' }}>
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="font-display text-xl font-medium">Pagamentos</h2>
          </div>

          <p className="font-body text-sm text-muted-foreground mb-4">
            Configure a integração com InfinitePay para processar pagamentos.
          </p>

          <div className="liquid-glass-card p-4 border-l-4 border-l-amber-400">
            <p className="font-body text-sm">
              Status: <span className="text-amber-600 font-medium">Pendente configuração</span>
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Entre em contato para configurar a integração com pagamentos.
            </p>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full glass-btn py-4 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </motion.button>
      </motion.div>
    </AdminLayout>
  );
};

export default Configuracoes;
