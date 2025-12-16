import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, User, Mail, Phone, ShoppingBag } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  ordersCount?: number;
  totalSpent?: number;
}

const Clientes = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    // Fetch profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar clientes");
      return;
    }

    // Fetch orders for each customer
    const customersWithOrders = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: orders } = await supabase
          .from("orders")
          .select("total")
          .eq("user_id", profile.user_id);

        return {
          ...profile,
          ordersCount: orders?.length || 0,
          totalSpent: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
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

  return (
    <AdminLayout title="Clientes">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
          <p className="font-display text-3xl font-semibold">{customers.length}</p>
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
          <p className="font-display text-3xl font-semibold">
            {customers.filter(c => c.ordersCount && c.ordersCount > 0).length}
          </p>
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
            R$ {(
              customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) /
              Math.max(customers.filter(c => c.ordersCount && c.ordersCount > 0).length, 1)
            ).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </p>
        </motion.div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="font-body text-muted-foreground">Carregando...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="liquid-card text-center py-12">
          <p className="font-body text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      ) : (
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
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
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
                      R$ {(customer.totalSpent || 0).toLocaleString('pt-BR')}
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

// Add missing import
import { TrendingUp } from "lucide-react";

export default Clientes;
