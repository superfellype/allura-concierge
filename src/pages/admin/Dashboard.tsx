import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface StatsCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
}

const Dashboard = () => {
  const [stats, setStats] = useState<StatsCard[]>([
    { title: "Pedidos Hoje", value: "0", change: "+0%", trend: "up", icon: ShoppingCart },
    { title: "Produtos Ativos", value: "0", change: "+0%", trend: "up", icon: Package },
    { title: "Clientes", value: "0", change: "+0%", trend: "up", icon: Users },
    { title: "Receita Mensal", value: "R$ 0", change: "+0%", trend: "up", icon: TrendingUp },
  ]);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  const fetchStats = async () => {
    // Fetch products count
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Fetch customers count
    const { count: customersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Fetch orders stats
    const { data: orders } = await supabase
      .from("orders")
      .select("total, created_at");

    const todayOrders = orders?.filter(o => {
      const orderDate = new Date(o.created_at).toDateString();
      return orderDate === new Date().toDateString();
    }).length || 0;

    const monthlyRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

    setStats([
      { title: "Pedidos Hoje", value: String(todayOrders), change: "+12%", trend: "up", icon: ShoppingCart },
      { title: "Produtos Ativos", value: String(productsCount || 0), change: "+3%", trend: "up", icon: Package },
      { title: "Clientes", value: String(customersCount || 0), change: "+8%", trend: "up", icon: Users },
      { title: "Receita Mensal", value: `R$ ${monthlyRevenue.toLocaleString('pt-BR')}`, change: "+15%", trend: "up", icon: TrendingUp },
    ]);
  };

  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`
        id,
        total,
        status,
        created_at,
        profiles:user_id (full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentOrders(data || []);
  };

  const statusColors: Record<string, string> = {
    created: "bg-gray-100 text-gray-700",
    pending_payment: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    packing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    created: "Criado",
    pending_payment: "Aguardando",
    paid: "Pago",
    packing: "Embalando",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  return (
    <AdminLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="stats-card"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-body ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
              </div>
            </div>
            <p className="font-display text-2xl font-semibold">{stat.value}</p>
            <p className="font-body text-sm text-muted-foreground mt-1">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="liquid-card"
      >
        <h2 className="font-display text-xl font-medium mb-6">Pedidos Recentes</h2>
        
        {recentOrders.length === 0 ? (
          <p className="font-body text-muted-foreground text-center py-8">
            Nenhum pedido ainda
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">#{order.id.slice(0, 8)}</td>
                    <td>{(order.profiles as any)?.full_name || 'Cliente'}</td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td>R$ {Number(order.total).toLocaleString('pt-BR')}</td>
                    <td className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default Dashboard;
