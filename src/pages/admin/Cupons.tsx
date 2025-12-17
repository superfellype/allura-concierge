import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Copy, Check, X, Percent, DollarSign } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { couponsService, Coupon } from "@/services/coupons.service";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { format } from "date-fns";

type CouponFormInput = Omit<Coupon, 'id' | 'current_uses' | 'created_at' | 'updated_at'>;

const Cupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<CouponFormInput>({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_value: 0,
    max_uses: null,
    starts_at: null,
    expires_at: null,
    is_active: true,
    applicable_products: null,
    applicable_categories: null
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await couponsService.getAll();
    if (error) {
      toast.error('Erro ao carregar cupons');
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_value: 0,
      max_uses: null,
      starts_at: null,
      expires_at: null,
      is_active: true,
      applicable_products: null,
      applicable_categories: null
    });
    setEditingCoupon(null);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_value: coupon.min_order_value || 0,
      max_uses: coupon.max_uses,
      starts_at: coupon.starts_at,
      expires_at: coupon.expires_at,
      is_active: coupon.is_active || true,
      applicable_products: coupon.applicable_products,
      applicable_categories: coupon.applicable_categories
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) {
      toast.error('Código é obrigatório');
      return;
    }

    if (form.discount_value <= 0) {
      toast.error('Valor do desconto deve ser maior que zero');
      return;
    }

    setSaving(true);

    try {
      if (editingCoupon) {
        const { error } = await couponsService.update(editingCoupon.id, form);
        if (error) throw error;
        toast.success('Cupom atualizado');
      } else {
        const { error } = await couponsService.create(form);
        if (error) throw error;
        toast.success('Cupom criado');
      }

      setDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar cupom');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await couponsService.delete(deleteId);
      if (error) throw error;
      toast.success('Cupom excluído');
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir cupom');
    } finally {
      setDeleteId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `R$ ${coupon.discount_value.toFixed(2)}`;
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    
    if (!coupon.is_active) {
      return <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">Inativo</span>;
    }
    
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Agendado</span>;
    }
    
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Expirado</span>;
    }
    
    if (coupon.max_uses && coupon.current_uses && coupon.current_uses >= coupon.max_uses) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Esgotado</span>;
    }
    
    return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Ativo</span>;
  };

  return (
    <AdminLayout title="Cupons">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Gerencie cupons de desconto para seus clientes.
          </p>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="liquid-button">
                <Plus className="w-4 h-4 mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="code">Código do Cupom</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="Ex: PRIMEIRACOMPRA"
                    className="mt-1 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount_type">Tipo de Desconto</Label>
                    <Select
                      value={form.discount_type}
                      onValueChange={(value: "percentage" | "fixed") => setForm(prev => ({ ...prev, discount_type: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount_value">Valor</Label>
                    <Input
                      id="discount_value"
                      type="number"
                      min="0"
                      step={form.discount_type === 'percentage' ? '1' : '0.01'}
                      value={form.discount_value}
                      onChange={(e) => setForm(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_order_value">Pedido Mínimo (R$)</Label>
                    <Input
                      id="min_order_value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.min_order_value || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, min_order_value: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_uses">Limite de Usos</Label>
                    <Input
                      id="max_uses"
                      type="number"
                      min="1"
                      value={form.max_uses || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, max_uses: parseInt(e.target.value) || null }))}
                      placeholder="Ilimitado"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="starts_at">Início</Label>
                    <Input
                      id="starts_at"
                      type="datetime-local"
                      value={form.starts_at ? form.starts_at.slice(0, 16) : ''}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        starts_at: e.target.value ? new Date(e.target.value).toISOString() : null 
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expires_at">Expiração</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={form.expires_at ? form.expires_at.slice(0, 16) : ''}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        expires_at: e.target.value ? new Date(e.target.value).toISOString() : null 
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Ativo</Label>
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="liquid-button"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Coupons List */}
        <div className="liquid-glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando cupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum cupom cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium">Código</th>
                    <th className="text-left p-4 font-medium">Desconto</th>
                    <th className="text-left p-4 font-medium">Pedido Mín.</th>
                    <th className="text-left p-4 font-medium">Usos</th>
                    <th className="text-left p-4 font-medium">Validade</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {coupons.map((coupon, index) => (
                    <motion.tr
                      key={coupon.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-muted rounded font-mono text-sm">
                            {coupon.code}
                          </code>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1">
                          {coupon.discount_type === 'percentage' ? (
                            <Percent className="w-4 h-4 text-primary" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-primary" />
                          )}
                          {formatDiscount(coupon)}
                        </span>
                      </td>
                      <td className="p-4">
                        {coupon.min_order_value ? `R$ ${coupon.min_order_value.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-4">
                        {coupon.current_uses || 0}
                        {coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                      </td>
                      <td className="p-4 text-sm">
                        {coupon.expires_at ? (
                          format(new Date(coupon.expires_at), 'dd/MM/yyyy')
                        ) : (
                          <span className="text-muted-foreground">Sem limite</span>
                        )}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(coupon)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(coupon)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(coupon.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Cupom"
        description="Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AdminLayout>
  );
};

export default Cupons;
