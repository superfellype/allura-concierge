import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Package,
  ShoppingBag,
  TrendingUp,
  ArrowLeft,
  Edit,
  MessageCircle,
  CreditCard,
  Save,
  X,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCpf, validateCpf, cleanCpf } from "@/lib/cpf-utils";

interface CustomerOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
  payment_method?: string;
}

interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  preferences: {
    cpf?: string;
    birth_date?: string;
    is_manual_customer?: boolean;
    address?: {
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
  } | null;
  orders: CustomerOrder[];
  totalSpent: number;
  ordersCount: number;
  averageTicket: number;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  created: { label: "Criado", class: "bg-muted text-muted-foreground" },
  pending_payment: { label: "Aguardando", class: "bg-amber-500/10 text-amber-600" },
  paid: { label: "Pago", class: "bg-emerald-500/10 text-emerald-600" },
  packing: { label: "Embalando", class: "bg-sky-500/10 text-sky-600" },
  shipped: { label: "Enviado", class: "bg-violet-500/10 text-violet-600" },
  delivered: { label: "Entregue", class: "bg-emerald-500/10 text-emerald-600" },
  cancelled: { label: "Cancelado", class: "bg-destructive/10 text-destructive" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
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

const ClientePerfil = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    cpf: "",
    birth_date: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
  });
  const [cpfError, setCpfError] = useState("");

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
    }
  }, [id]);

  const fetchCustomer = async (customerId: string) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", customerId)
      .single();

    if (error || !profile) {
      toast.error("Cliente não encontrado");
      navigate("/admin/clientes");
      return;
    }

    // Try to get email from auth.users via a join or manual lookup
    let email: string | null = null;
    
    // For manual customers, email might be in preferences
    const prefs = profile.preferences as CustomerProfile['preferences'];
    if (prefs?.is_manual_customer) {
      // Manual customers might have email stored in preferences
      email = (prefs as any)?.email || null;
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, status, created_at, payment_method")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false });

    const customerOrders = orders || [];
    const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const ordersCount = customerOrders.length;
    const averageTicket = ordersCount > 0 ? totalSpent / ordersCount : 0;

    setCustomer({
      ...profile,
      email,
      preferences: prefs,
      orders: customerOrders,
      totalSpent,
      ordersCount,
      averageTicket,
    });
    setLoading(false);
  };

  const openEditModal = () => {
    if (customer) {
      setEditForm({
        full_name: customer.full_name || "",
        phone: customer.phone || "",
        cpf: customer.preferences?.cpf || "",
        birth_date: customer.preferences?.birth_date || "",
        street: customer.preferences?.address?.street || "",
        number: customer.preferences?.address?.number || "",
        neighborhood: customer.preferences?.address?.neighborhood || "",
        city: customer.preferences?.address?.city || "",
        state: customer.preferences?.address?.state || "",
        zip: customer.preferences?.address?.zip || "",
      });
      setCpfError("");
      setEditModalOpen(true);
    }
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    setEditForm(prev => ({ ...prev, cpf: formatted }));
    
    const cleaned = cleanCpf(formatted);
    if (cleaned.length === 11) {
      if (!validateCpf(cleaned)) {
        setCpfError("CPF inválido");
      } else {
        setCpfError("");
      }
    } else {
      setCpfError("");
    }
  };

  const handleSaveCustomer = async () => {
    if (!customer) return;

    // Validate CPF if provided
    const cleanedCpf = cleanCpf(editForm.cpf);
    if (cleanedCpf && cleanedCpf.length === 11 && !validateCpf(cleanedCpf)) {
      setCpfError("CPF inválido");
      return;
    }

    setSaving(true);
    try {
      const updatedPreferences = {
        ...customer.preferences,
        cpf: editForm.cpf || undefined,
        birth_date: editForm.birth_date || undefined,
        address: {
          street: editForm.street || undefined,
          number: editForm.number || undefined,
          neighborhood: editForm.neighborhood || undefined,
          city: editForm.city || undefined,
          state: editForm.state || undefined,
          zip: editForm.zip || undefined,
        },
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name || null,
          phone: editForm.phone || null,
          preferences: updatedPreferences,
        })
        .eq("id", customer.id);

      if (error) throw error;

      toast.success("Cliente atualizado com sucesso!");
      setEditModalOpen(false);
      fetchCustomer(customer.id);
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Erro ao atualizar cliente");
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = () => {
    if (customer?.phone) {
      const phone = customer.phone.replace(/\D/g, '');
      const phoneWithCountry = phone.startsWith('55') ? phone : `55${phone}`;
      window.open(`https://wa.me/${phoneWithCountry}`, '_blank');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Perfil do Cliente">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout title="Perfil do Cliente">
        <div className="text-center py-20">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cliente não encontrado</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Perfil do Cliente">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Back Button */}
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/clientes")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Clientes
          </Button>
        </motion.div>

        {/* Header Card */}
        <motion.div 
          variants={itemVariants}
          className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              {customer.avatar_url ? (
                <img
                  src={customer.avatar_url}
                  alt={customer.full_name || ""}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold">
                    {customer.full_name || "Sem nome"}
                  </h2>
                  <p className="font-body text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {customer.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openWhatsApp}
                      className="gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openEditModal}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customer.email && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-body text-sm">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-body text-sm">{customer.phone}</span>
                  </div>
                )}
                {customer.preferences?.cpf && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="font-body text-sm">{customer.preferences.cpf}</span>
                  </div>
                )}
                {customer.preferences?.birth_date && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-body text-sm">
                      {new Date(customer.preferences.birth_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Address */}
              {customer.preferences?.address && (
                <div className="mt-4 p-3 rounded-xl bg-muted/50 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="font-body text-sm">
                    {customer.preferences.address.street && (
                      <p>
                        {customer.preferences.address.street}
                        {customer.preferences.address.number && `, ${customer.preferences.address.number}`}
                      </p>
                    )}
                    {customer.preferences.address.neighborhood && (
                      <p>{customer.preferences.address.neighborhood}</p>
                    )}
                    <p>
                      {customer.preferences.address.city && customer.preferences.address.city}
                      {customer.preferences.address.state && ` - ${customer.preferences.address.state}`}
                      {customer.preferences.address.zip && ` • ${customer.preferences.address.zip}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">{customer.ordersCount}</p>
                <p className="font-body text-sm text-muted-foreground">Total de Pedidos</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">
                  R$ {customer.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="font-body text-sm text-muted-foreground">Total Gasto</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center">
                <Package className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">
                  R$ {customer.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                <p className="font-body text-sm text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Orders History */}
        <motion.div 
          variants={itemVariants}
          className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-lg font-semibold">Histórico de Pedidos</h2>
          </div>

          {customer.orders.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-body text-muted-foreground">Nenhum pedido realizado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-3 px-4 font-body text-sm font-medium text-muted-foreground">
                      Pedido
                    </th>
                    <th className="text-left py-3 px-4 font-body text-sm font-medium text-muted-foreground">
                      Data
                    </th>
                    <th className="text-left py-3 px-4 font-body text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-body text-sm font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((order, idx) => {
                    const status = statusLabels[order.status] || { label: order.status, class: "bg-muted text-muted-foreground" };
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-border/20 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Link
                            to={`/admin/pedidos`}
                            className="font-body text-sm font-medium text-primary hover:underline"
                          >
                            #{order.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-body text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-display text-sm font-semibold">
                          R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Edit Customer Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Editar Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-display text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={editForm.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={cpfError ? "border-destructive" : ""}
                  />
                  {cpfError && (
                    <p className="text-xs text-destructive">{cpfError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={editForm.birth_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, birth_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-display text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Endereço
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={editForm.street}
                    onChange={(e) => setEditForm(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Nome da rua"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={editForm.number}
                    onChange={(e) => setEditForm(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={editForm.neighborhood}
                    onChange={(e) => setEditForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={editForm.city}
                    onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={editForm.state}
                    onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">CEP</Label>
                  <Input
                    id="zip"
                    value={editForm.zip}
                    onChange={(e) => setEditForm(prev => ({ ...prev, zip: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCustomer}
              disabled={saving || !!cpfError}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ClientePerfil;
