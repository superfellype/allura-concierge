import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Copy, Percent, DollarSign } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { couponsService, Coupon } from "@/services/coupons.service";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import CouponForm, { CouponFormValues } from "@/components/admin/CouponForm";
import { format } from "date-fns";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Cupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setDialogOpen(true);
  };

  const handleFormSubmit = async (data: CouponFormValues) => {
    setSaving(true);

    try {
      const couponData = {
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_value: data.min_order_value || 0,
        max_uses: data.max_uses || null,
        starts_at: data.starts_at || null,
        expires_at: data.expires_at || null,
        is_active: data.is_active,
        applicable_products: null,
        applicable_categories: null,
      };

      if (editingCoupon) {
        const { error } = await couponsService.update(editingCoupon.id, couponData);
        if (error) throw error;
        toast.success('Cupom atualizado');
      } else {
        const { error } = await couponsService.create(couponData);
        if (error) throw error;
        toast.success('Cupom criado');
      }

      setDialogOpen(false);
      setEditingCoupon(null);
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
      return <span className="status-badge status-badge-neutral">Inativo</span>;
    }
    
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return <span className="status-badge status-badge-info">Agendado</span>;
    }
    
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return <span className="status-badge status-badge-warning">Expirado</span>;
    }
    
    if (coupon.max_uses && coupon.current_uses && coupon.current_uses >= coupon.max_uses) {
      return <span className="status-badge status-badge-danger">Esgotado</span>;
    }
    
    return <span className="status-badge status-badge-success">Ativo</span>;
  };

  const getDefaultValues = (coupon: Coupon | null): Partial<CouponFormValues> => {
    if (!coupon) return {};
    return {
      code: coupon.code,
      discount_type: coupon.discount_type as "percentage" | "fixed",
      discount_value: coupon.discount_value,
      min_order_value: coupon.min_order_value || 0,
      max_uses: coupon.max_uses,
      starts_at: coupon.starts_at,
      expires_at: coupon.expires_at,
      is_active: coupon.is_active ?? true,
    };
  };

  return (
    <AdminLayout title="Cupons">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground font-body">
            Gerencie cupons de desconto para seus clientes.
          </p>
          <Dialog 
            open={dialogOpen} 
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditingCoupon(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="glass-btn">
                <Plus className="w-4 h-4 mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg liquid-glass-card border-0">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                </DialogTitle>
              </DialogHeader>
              <CouponForm
                key={editingCoupon?.id || 'new'}
                defaultValues={getDefaultValues(editingCoupon)}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setDialogOpen(false);
                  setEditingCoupon(null);
                }}
                isEditing={!!editingCoupon}
                isSaving={saving}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Coupons List */}
        <div className="liquid-glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground font-body">
              Carregando cupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground font-body">
              Nenhum cupom cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table w-full">
                <thead>
                  <tr>
                    <th className="text-left p-4 font-medium font-body">Código</th>
                    <th className="text-left p-4 font-medium font-body">Desconto</th>
                    <th className="text-left p-4 font-medium font-body">Pedido Mín.</th>
                    <th className="text-left p-4 font-medium font-body">Usos</th>
                    <th className="text-left p-4 font-medium font-body">Validade</th>
                    <th className="text-left p-4 font-medium font-body">Status</th>
                    <th className="text-right p-4 font-medium font-body">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {coupons.map((coupon, index) => (
                    <motion.tr
                      key={coupon.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2.5 py-1 bg-muted/50 rounded-lg font-mono text-sm">
                            {coupon.code}
                          </code>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 font-body">
                          {coupon.discount_type === 'percentage' ? (
                            <Percent className="w-4 h-4 text-primary" />
                          ) : (
                            <DollarSign className="w-4 h-4 text-primary" />
                          )}
                          {formatDiscount(coupon)}
                        </span>
                      </td>
                      <td className="p-4 font-body">
                        {coupon.min_order_value ? `R$ ${coupon.min_order_value.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-4 font-body">
                        {coupon.current_uses || 0}
                        {coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
                      </td>
                      <td className="p-4 text-sm font-body">
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
                            className="hover:bg-secondary/50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(coupon.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
