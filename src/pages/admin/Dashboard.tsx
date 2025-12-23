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
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
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

interface ActivityItem {
  id: string;
  type: "order" | "product" | "customer";
  message: string;
  time: string;
  icon: React.ElementType;
}

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
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Dashboard = () => {
  const [stats, setStats] = useState<StatsCard[]>([
    { title: "Pedidos Hoje", value: "0", change: "+0%", trend: "up", icon: ShoppingCart },
    { title: "Produtos Ativos", value: "0", change: "+0%", trend: "up", icon: Package },
    { title: "Clientes", value: "0", change: "+0%", trend: "up", icon: Users },
    { title: "Receita Mensal", value: "R$ 0", change: "+0%", trend: "up", icon: TrendingUp },
  ]);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchStats(),
      fetchRecentOrders(),
      fetchRevenueData(),
      fetchLowStock(),
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
        value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
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

      // Build activities from orders
      const orderActivities: ActivityItem[] = ordersWithProfiles.slice(0, 4).map(order => ({
        id: order.id,
        type: "order" as const,
        message: `Novo pedido de ${order.profiles?.full_name || 'Cliente'}`,
        time: formatTimeAgo(new Date(order.created_at)),
        icon: ShoppingCart,
      }));
      setActivities(orderActivities);
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
          name: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
          receita: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
          pedidos: dayOrders.length,
        };
      });

      setRevenueData(chartData);
    }
  };

  const fetchLowStock = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, stock_quantity, low_stock_threshold")
      .eq("is_active", true)
      .or("stock_quantity.lt.10,stock_quantity.eq.0")
      .order("stock_quantity", { ascending: true })
      .limit(5);

    setLowStockProducts(data || []);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Grid with KPI Numbers */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              className="card-minimal p-5"
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
              <p className="kpi-number">{stat.value}</p>
              <p className="font-body text-sm text-muted-foreground mt-1">{stat.title}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart - Takes 2 columns */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 card-minimal p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-medium">Receita</h2>
              </div>
              <span className="font-body text-xs text-muted-foreground">Últimos 7 dias</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value > 0 ? `${(value/1000).toFixed(0)}k` : '0'}
                    width={35}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontFamily: 'Inter',
                      fontSize: '13px'
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            variants={itemVariants}
            className="card-minimal p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-secondary">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="font-display text-lg font-medium">Atividade</h2>
            </div>
            
            <div className="space-y-1">
              {activities.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground text-center py-8">
                  Nenhuma atividade recente
                </p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <activity.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-foreground truncate">
                        {activity.message}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <motion.div
            variants={itemVariants}
            className="card-minimal p-6"
          >
            <h2 className="font-display text-lg font-medium mb-6">Pedidos Recentes</h2>
            
            {recentOrders.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-8">
                Nenhum pedido ainda
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium truncate">
                        {order.profiles?.full_name || 'Cliente'}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                      <span className="font-body text-sm font-medium">
                        R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Stock Alerts */}
          <motion.div
            variants={itemVariants}
            className="card-minimal p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="font-display text-lg font-medium">Alertas de Estoque</h2>
            </div>
            
            {lowStockProducts.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-8">
                Estoque em dia
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <p className="font-body text-sm truncate flex-1">
                      {product.name}
                    </p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      product.stock_quantity === 0 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {product.stock_quantity === 0 ? 'Esgotado' : `${product.stock_quantity} un`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Dashboard;
