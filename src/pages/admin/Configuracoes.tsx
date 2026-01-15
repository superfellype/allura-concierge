import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Store, Truck, CreditCard, Percent, Edit2, Check, X, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { paymentSettingsService, PaymentSetting, Installment } from "@/services/payment-settings.service";

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

  const [paymentMethods, setPaymentMethods] = useState<PaymentSetting[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [editingMethod, setEditingMethod] = useState<PaymentSetting | null>(null);
  const [editedInstallments, setEditedInstallments] = useState<Installment[]>([]);
  const [savingPayment, setSavingPayment] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    setLoadingPayments(true);
    const { data, error } = await paymentSettingsService.getAll();
    if (error) {
      toast.error("Erro ao carregar métodos de pagamento");
    } else {
      setPaymentMethods(data || []);
    }
    setLoadingPayments(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Configurações salvas!");
    setSaving(false);
  };

  const openEditMethod = (method: PaymentSetting) => {
    setEditingMethod(method);
    setEditedInstallments([...method.installments]);
  };

  const handleUpdateInstallmentTax = (qty: number, newTax: number) => {
    setEditedInstallments(prev => 
      prev.map(inst => inst.qty === qty ? { ...inst, tax: newTax } : inst)
    );
  };

  const handleSavePaymentMethod = async () => {
    if (!editingMethod) return;

    setSavingPayment(true);
    const { error } = await paymentSettingsService.update(editingMethod.id, {
      installments: editedInstallments,
    });

    if (error) {
      toast.error("Erro ao salvar taxas");
    } else {
      toast.success("Taxas atualizadas!");
      await loadPaymentSettings();
      setEditingMethod(null);
    }
    setSavingPayment(false);
  };

  const handleToggleMethodActive = async (method: PaymentSetting) => {
    const { error } = await paymentSettingsService.update(method.id, {
      is_active: !method.is_active,
    });

    if (error) {
      toast.error("Erro ao atualizar método");
    } else {
      await loadPaymentSettings();
    }
  };

  return (
    <AdminLayout title="Configurações">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl space-y-6"
      >
        {/* Store Info */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl font-medium">Informações da Loja</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                Nome da Loja
              </label>
              <Input
                type="text"
                value={storeSettings.storeName}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                  E-mail
                </label>
                <Input
                  type="email"
                  value={storeSettings.email}
                  onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                  Telefone
                </label>
                <Input
                  type="text"
                  value={storeSettings.phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                Endereço
              </label>
              <Input
                type="text"
                value={storeSettings.address}
                onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
              />
            </div>

            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                WhatsApp (número completo com DDD)
              </label>
              <Input
                type="text"
                value={storeSettings.whatsapp}
                onChange={(e) => setStoreSettings({ ...storeSettings, whatsapp: e.target.value })}
              />
            </div>
          </div>
        </motion.div>

        {/* Shipping */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
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
                <Input
                  type="number"
                  value={shippingSettings.freeShippingMinimum}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingMinimum: e.target.value })}
                />
              </div>
              <div>
                <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                  Custo padrão de frete (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={shippingSettings.defaultShippingCost}
                  onChange={(e) => setShippingSettings({ ...shippingSettings, defaultShippingCost: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-muted-foreground mb-1.5 block">
                Prazo estimado de entrega (dias úteis)
              </label>
              <Input
                type="text"
                value={shippingSettings.estimatedDays}
                onChange={(e) => setShippingSettings({ ...shippingSettings, estimatedDays: e.target.value })}
              />
            </div>
          </div>
        </motion.div>

        {/* Payment Methods with Taxes */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Percent className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-medium">Taxas de Pagamento</h2>
              <p className="text-sm text-muted-foreground">Configure as taxas das maquininhas para venda manual</p>
            </div>
          </div>

          {loadingPayments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{method.icon}</span>
                    <div>
                      <p className="font-medium">{method.method_label}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.installments.length === 1 
                          ? `Taxa: ${method.installments[0].tax}%`
                          : `${method.installments.length} opções de parcelamento`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={method.is_active}
                      onCheckedChange={() => handleToggleMethodActive(method)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditMethod(method)}
                      className="gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar Taxas
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Payment Integration Info */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="font-display text-xl font-medium">Integração de Pagamentos</h2>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="font-body text-sm">
              Status: <span className="text-amber-600 font-medium">Pendente configuração</span>
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Entre em contato para configurar a integração com pagamentos online.
            </p>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants}>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 text-base"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </motion.div>
      </motion.div>

      {/* Edit Payment Method Dialog */}
      <Dialog open={!!editingMethod} onOpenChange={(open) => !open && setEditingMethod(null)}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{editingMethod?.icon}</span>
              {editingMethod?.method_label}
            </DialogTitle>
            <DialogDescription>
              Configure as taxas para cada opção de parcelamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2">
              {editedInstallments.map((inst) => (
                <div
                  key={inst.qty}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {inst.qty === 1 ? 'À vista' : `${inst.qty}x`}
                    </p>
                    <p className="text-xs text-muted-foreground">{inst.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={inst.tax}
                      onChange={(e) => handleUpdateInstallmentTax(inst.qty, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditingMethod(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSavePaymentMethod}
                disabled={savingPayment}
                className="flex-1"
              >
                {savingPayment ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Salvar Taxas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Configuracoes;
