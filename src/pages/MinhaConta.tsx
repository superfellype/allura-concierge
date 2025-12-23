import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Package, MapPin, LogOut, ChevronRight, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatPrice } from "@/lib/payment/infinitepay-adapter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  shipping_address: Record<string, unknown> | null;
}

interface Profile {
  full_name: string;
  phone: string;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; badgeClass: string }> = {
  created: { label: 'Criado', icon: Clock, color: 'text-gray-500', badgeClass: 'status-badge status-badge-neutral' },
  pending_payment: { label: 'Aguardando Pagamento', icon: Clock, color: 'text-amber-500', badgeClass: 'status-badge status-badge-warning' },
  paid: { label: 'Pago', icon: CheckCircle, color: 'text-green-500', badgeClass: 'status-badge status-badge-success' },
  packing: { label: 'Preparando', icon: Package, color: 'text-blue-500', badgeClass: 'status-badge status-badge-info' },
  shipped: { label: 'Enviado', icon: Truck, color: 'text-purple-500', badgeClass: 'status-badge status-badge-info' },
  delivered: { label: 'Entregue', icon: CheckCircle, color: 'text-green-600', badgeClass: 'status-badge status-badge-success' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-500', badgeClass: 'status-badge status-badge-danger' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const MinhaConta = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Profile>({ full_name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/minha-conta');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, status, total, created_at, shipping_address')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders((ordersData || []) as Order[]);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Perfil atualizado!');
    } catch (error: any) {
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100/50 to-secondary/20 noise-bg">
      <Navbar />
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-morph" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl animate-morph" style={{ animationDelay: "-4s" }} />
      </div>
      
      <main className="relative z-10 pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-serif mb-8"
          >
            Minha Conta
          </motion.h1>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-4 gap-8"
          >
            {/* Sidebar */}
            <motion.div variants={itemVariants} className="md:col-span-1">
              <div className="liquid-glass-card p-4 space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    activeTab === 'orders'
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span>Meus Pedidos</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    activeTab === 'profile'
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Meu Perfil</span>
                </button>
                <div className="glass-divider my-2" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div variants={itemVariants} className="md:col-span-3">
              {loading ? (
                <div className="liquid-glass-card p-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted/50 rounded w-1/3" />
                    <div className="h-24 bg-muted/50 rounded" />
                  </div>
                </div>
              ) : activeTab === 'orders' ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-serif mb-4">Meus Pedidos</h2>
                  
                  {orders.length === 0 ? (
                    <div className="liquid-glass-card p-8 text-center empty-state">
                      <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Você ainda não fez nenhum pedido</p>
                    </div>
                  ) : (
                    orders.map((order, index) => {
                      const status = statusConfig[order.status] || statusConfig.created;
                      const StatusIcon = status.icon;
                      
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="liquid-glass-card p-6"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Pedido #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <span className={status.badgeClass}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="glass-kpi text-xl">
                              {formatPrice(order.total)}
                            </span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="liquid-glass-card p-6">
                  <h2 className="text-xl font-serif mb-6">Meu Perfil</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user.email || ''}
                        disabled
                        className="mt-1 glass-input bg-muted/30"
                      />
                    </div>

                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={profile.full_name || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                        className="mt-1 glass-input"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(00) 00000-0000"
                        className="mt-1 glass-input"
                      />
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="glass-btn py-3 px-6 mt-4"
                    >
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MinhaConta;
