import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag, TrendingUp, Eye, Package, Calendar } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CustomerOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

interface Customer {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  ordersCount: number;
  totalSpent: number;
  orders?: CustomerOrder[];
}

const ITEMS_PER_PAGE = 15;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
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

const Clientes = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar clientes");
      return;
    }

    const customersWithOrders = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, total, status, created_at")
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false });

        return {
          ...profile,
          ordersCount: orders?.length || 0,
          totalSpent: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
          orders: orders || [],
        };
      })
    );

    setCustomers(customersWithOrders);
    setLoading(false);
  };

  const filteredCustomers = customers.filter((c) =>
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalCustomers = customers.length;
  const customersWithOrders = customers.filter(c => c.ordersCount > 0).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageTicket = customersWithOrders > 0 ? totalRevenue / customersWithOrders : 0;

  return (
    <AdminLayout title="Clientes">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">{totalCustomers}</p>
                <p className="font-body text-sm text-muted-foreground">Total de Clientes</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">{customersWithOrders}</p>
                <p className="font-body text-sm text-muted-foreground">Com Pedidos</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">
                  R$ {averageTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
                <p className="font-body text-sm text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants}>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border/40 bg-card/60 backdrop-blur-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
        </motion.div>

        {/* Customers List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-body text-muted-foreground mt-2">Carregando...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-body text-muted-foreground">Nenhum cliente encontrado</p>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Cliente
                      </th>
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Telefone
                      </th>
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Pedidos
                      </th>
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Total Gasto
                      </th>
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Cadastro
                      </th>
                      <th className="text-right py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/20 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                              {customer.avatar_url ? (
                                <img
                                  src={customer.avatar_url}
                                  alt={customer.full_name || ""}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                <User className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <span className="font-body font-medium">{customer.full_name || "Sem nome"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-body text-sm text-muted-foreground">
                          {customer.phone || "—"}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                            customer.ordersCount > 0 
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {customer.ordersCount} pedido(s)
                          </span>
                        </td>
                        <td className="py-4 px-6 font-display text-sm font-semibold">
                          R$ {customer.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 font-body text-sm text-muted-foreground">
                          {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/clientes/${customer.id}`)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Perfil
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </motion.div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default Clientes;
