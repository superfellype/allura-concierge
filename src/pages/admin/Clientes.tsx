import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, User, ShoppingBag, TrendingUp, X, Package, Calendar } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const statusLabels: Record<string, string> = {
  created: "Criado",
  pending_payment: "Aguardando",
  paid: "Pago",
  packing: "Embalando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const Clientes = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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

  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="stats-card"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span className="font-body text-sm text-muted-foreground">Total de Clientes</span>
          </div>
          <p className="font-display text-3xl font-semibold">{totalCustomers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stats-card"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-green-100">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-body text-sm text-muted-foreground">Clientes com Pedidos</span>
          </div>
          <p className="font-display text-3xl font-semibold">{customersWithOrders}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stats-card"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-purple-100">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-body text-sm text-muted-foreground">Ticket Médio</span>
          </div>
          <p className="font-display text-3xl font-semibold">
            R$ {averageTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </p>
        </motion.div>
      </div>

      {/* Search */}
      <div className="mb-6">
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
            className="w-full pl-11 pr-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-muted-foreground mt-2">Carregando...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="liquid-card text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-body text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <>
          <div className="liquid-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr className="bg-secondary/30">
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Pedidos</th>
                    <th>Total Gasto</th>
                    <th>Cadastro</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((customer, index) => (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="cursor-pointer"
                      onClick={() => openCustomerDetail(customer)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {customer.avatar_url ? (
                              <img
                                src={customer.avatar_url}
                                alt={customer.full_name || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <span className="font-medium">{customer.full_name || "Sem nome"}</span>
                        </div>
                      </td>
                      <td className="text-muted-foreground">
                        {customer.phone || "—"}
                      </td>
                      <td>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary">
                          {customer.ordersCount} pedido(s)
                        </span>
                      </td>
                      <td className="font-semibold">
                        R$ {customer.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-muted-foreground">
                        {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <button className="text-primary hover:underline text-sm font-body">
                          Ver detalhes
                        </button>
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
        </>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSelectedCustomer(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-lg liquid-card-strong p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {selectedCustomer.avatar_url ? (
                    <img
                      src={selectedCustomer.avatar_url}
                      alt={selectedCustomer.full_name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="font-display text-xl font-medium">
                    {selectedCustomer.full_name || "Sem nome"}
                  </h2>
                  <p className="font-body text-sm text-muted-foreground">
                    Cliente desde {new Date(selectedCustomer.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-secondary rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-secondary/30 text-center">
                <p className="font-display text-2xl font-semibold">{selectedCustomer.ordersCount}</p>
                <p className="font-body text-sm text-muted-foreground">Pedidos</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/30 text-center">
                <p className="font-display text-2xl font-semibold">
                  R$ {selectedCustomer.totalSpent.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
                <p className="font-body text-sm text-muted-foreground">Total Gasto</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-6">
              <h3 className="font-body font-medium mb-3">Contato</h3>
              <div className="space-y-2">
                {selectedCustomer.phone && (
                  <p className="font-body text-sm">
                    Telefone: <span className="text-muted-foreground">{selectedCustomer.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Orders History */}
            {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
              <div>
                <h3 className="font-body font-medium mb-3">Histórico de Pedidos</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCustomer.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-body text-sm font-medium">#{order.id.slice(0, 8)}</p>
                          <p className="font-body text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-body text-sm font-medium">
                          R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          {statusLabels[order.status] || order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedCustomer(null)}
              className="mt-6 w-full py-3 glass-button rounded-xl font-body font-medium"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Clientes;
