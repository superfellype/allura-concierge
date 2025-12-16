import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Store, Truck, CreditCard, Bell } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";

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
    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Configurações salvas!");
    setSaving(false);
  };

  return (
    <AdminLayout title="Configurações">
      <div className="max-w-3xl space-y-6">
        {/* Store Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-medium">Informações da Loja</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                Nome da Loja
              </label>
              <input
                type="text"
                value={storeSettings.storeName}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                  E-mail
                </label>
                <input
                  type="email"
                  value={storeSettings.email}
                  onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                  className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                  Telefone
                </label>
                <input
                  type="text"
                  value={storeSettings.phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                  className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                Endereço
              </label>
              <input
                type="text"
                value={storeSettings.address}
                onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                WhatsApp (número completo com DDD)
              </label>
              <input
                type="text"
                value={storeSettings.whatsapp}
                onChange={(e) => setStoreSettings({ ...storeSettings, whatsapp: e.target.value })}
                className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </motion.div>

        {/* Shipping */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="liquid-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-100">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-display text-xl font-medium">Frete e Entrega</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                  Frete grátis acima de (R$)
                </label>
                <input
                  type="number"
                  value={shippingSettings.freeShippingMinimum}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingMinimum: e.target.value })}
                  className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                  Custo padrão de frete (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={shippingSettings.defaultShippingCost}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, defaultShippingCost: e.target.value })}
                  className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                Prazo estimado de entrega (dias úteis)
              </label>
              <input
                type="text"
                value={shippingSettings.estimatedDays}
                onChange={(e) => setShippingSettings({ ...shippingSettings, estimatedDays: e.target.value })}
                className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </motion.div>

        {/* Payment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="liquid-card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-green-100">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="font-display text-xl font-medium">Pagamentos</h2>
          </div>

          <p className="font-body text-sm text-muted-foreground mb-4">
            Configure a integração com InfinitePay para processar pagamentos.
          </p>

          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50">
            <p className="font-body text-sm text-foreground/70">
              Status: <span className="text-yellow-600 font-medium">Pendente configuração</span>
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Entre em contato para configurar a integração com pagamentos.
            </p>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full liquid-button py-4 text-primary-foreground font-body font-medium flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </motion.button>
      </div>
    </AdminLayout>
  );
};

export default Configuracoes;
