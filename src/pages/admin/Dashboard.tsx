import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface StatsCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
}

interface RevenueData {
  name: string;
  receita: number;
  pedidos: number;
}

interface TopProduct {
  name: string;
  vendas: number;
  receita: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<StatsCard[]>([
    { title: "Pedidos Hoje", value: "0", change: "+0%", trend: "up", icon: ShoppingCart },
    { title: "Produtos Ativos", value: "0", change: "+0%", trend: "up", icon: Package },
    { title: "Clientes", value: "0", change: "+0%", trend: "up", icon: Users },
    { title: "Receita Mensal", value: "R$ 0", change: "+0%", trend: "up", icon: TrendingUp },
  ]);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchStats(),
      fetchRecentOrders(),
      fetchRevenueData(),
      fetchTopProducts(),
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: customersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { data: orders } = await supabase
      .from("orders")
      .select("total, created_at, status");

    const today = new Date().toDateString();
    const todayOrders = orders?.filter(o => 
      new Date(o.created_at).toDateString() === today
    ).length || 0;

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthlyRevenue = orders?.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear && o.status !== 'cancelled';
    }).reduce((sum, o) => sum + Number(o.total), 0) || 0;

    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const lastMonthRevenue = orders?.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && o.status !== 'cancelled';
    }).reduce((sum, o) => sum + Number(o.total), 0) || 0;

    const revenueChange = lastMonthRevenue > 0 
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    setStats([
      { title: "Pedidos Hoje", value: String(todayOrders), change: "+12%", trend: "up", icon: ShoppingCart },
      { title: "Produtos Ativos", value: String(productsCount || 0), change: "+3%", trend: "up", icon: Package },
      { title: "Clientes", value: String(customersCount || 0), change: "+8%", trend: "up", icon: Users },
      { 
        title: "Receita Mensal", 
        value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
        change: `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`, 
        trend: revenueChange >= 0 ? "up" : "down", 
        icon: TrendingUp 
      },
    ]);
  };

  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, total, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      const ordersWithProfiles = await Promise.all(
        data.map(async (order) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", order.user_id)
            .maybeSingle();
          return { ...order, profiles: profile };
        })
      );
      setRecentOrders(ordersWithProfiles);
    }
  };

  const fetchRevenueData = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select("total, created_at, status")
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    if (orders) {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const chartData = last7Days.map(date => {
        const dayOrders = orders.filter(o => 
          new Date(o.created_at).toDateString() === date.toDateString()
        );
        return {
          name: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
          receita: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          pedidos: dayOrders.length,
        };
      });

      setRevenueData(chartData);
    }
  };

  const fetchTopProducts = async () => {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, total_price");

    if (orderItems) {
      const productSales: Record<string, { quantity: number; revenue: number }> = {};
      orderItems.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { quantity: 0, revenue: 0 };
        }
        productSales[item.product_id].quantity += item.quantity;
        productSales[item.product_id].revenue += Number(item.total_price);
      });

      const productIds = Object.keys(productSales);
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      const topProds = products?.map(p => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        vendas: productSales[p.id]?.quantity || 0,
        receita: productSales[p.id]?.revenue || 0,
      })).sort((a, b) => b.vendas - a.vendas).slice(0, 5) || [];

      setTopProducts(topProds);
    }
  };

  const statusColors: Record<string, string> = {
    created: "bg-muted text-muted-foreground",
    pending_payment: "bg-amber-100 text-amber-700",
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="chart-container"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-lg font-medium">Receita - Últimos 7 dias</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontFamily: 'Inter'
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                />
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Products Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="chart-container"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-green-100">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="font-display text-lg font-medium">Produtos Mais Vendidos</h2>
          </div>
          <div className="h-64">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontFamily: 'Inter'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'vendas' ? `${value} unidades` : `R$ ${value.toLocaleString('pt-BR')}`,
                      name === 'vendas' ? 'Vendas' : 'Receita'
                    ]}
                  />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground font-body">
                Nenhuma venda ainda
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
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
                    <td>{order.profiles?.full_name || 'Cliente'}</td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td>R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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
