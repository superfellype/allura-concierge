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
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface StatsCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  gradient: string;
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
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const Dashboard = () => {
  const [stats, setStats] = useState<StatsCard[]>([
    { title: "Pedidos Hoje", value: "0", change: "+0%", trend: "up", icon: ShoppingCart, gradient: "from-primary/20 to-accent/10" },
    { title: "Produtos Ativos", value: "0", change: "+0%", trend: "up", icon: Package, gradient: "from-accent/20 to-primary/10" },
    { title: "Clientes", value: "0", change: "+0%", trend: "up", icon: Users, gradient: "from-secondary to-muted/50" },
    { title: "Receita Mensal", value: "R$ 0", change: "+0%", trend: "up", icon: TrendingUp, gradient: "from-primary/15 to-accent/20" },
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
      { title: "Pedidos Hoje", value: String(todayOrders), change: "+12%", trend: "up", icon: ShoppingCart, gradient: "from-primary/20 to-accent/10" },
      { title: "Produtos Ativos", value: String(productsCount || 0), change: "+3%", trend: "up", icon: Package, gradient: "from-accent/20 to-primary/10" },
      { title: "Clientes", value: String(customersCount || 0), change: "+8%", trend: "up", icon: Users, gradient: "from-secondary to-muted/50" },
      { 
        title: "Receita Mensal", 
        value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
        change: `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`, 
        trend: revenueChange >= 0 ? "up" : "down", 
        icon: TrendingUp,
        gradient: "from-primary/15 to-accent/20"
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      created: { class: "glass-badge", label: "Criado" },
      pending_payment: { class: "glass-badge glass-badge-warning", label: "Aguardando" },
      paid: { class: "glass-badge glass-badge-success", label: "Pago" },
      packing: { class: "glass-badge glass-badge-info", label: "Embalando" },
      shipped: { class: "glass-badge glass-badge-info", label: "Enviado" },
      delivered: { class: "glass-badge glass-badge-success", label: "Entregue" },
      cancelled: { class: "glass-badge glass-badge-danger", label: "Cancelado" },
    };
    return badges[status] || { class: "glass-badge", label: status };
  };

  return (
    <AdminLayout title="Dashboard">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="glass-icon glass-icon-md">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-medium text-foreground">Bem-vindo de volta</h2>
            <p className="font-body text-sm text-muted-foreground">
              Aqui está o resumo da sua loja hoje
            </p>
          </div>
        </motion.div>

        {/* Stats Grid - Liquid Glass Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              className="liquid-glass-card p-5 lg:p-6"
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`glass-icon glass-icon-sm bg-gradient-to-br ${stat.gradient}`}>
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-body font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {stat.change}
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                  </div>
                </div>
                <p className="glass-kpi glass-kpi-lg">{stat.value}</p>
                <p className="font-body text-sm text-muted-foreground mt-2">{stat.title}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart - Takes 2 columns */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 liquid-glass-card p-6"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="glass-icon glass-icon-sm">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="font-display text-lg font-medium">Receita</h2>
                </div>
                <span className="glass-badge">Últimos 7 dias</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(16 60% 50%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(16 60% 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))" 
                      strokeOpacity={0.5}
                      vertical={false} 
                    />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => value > 0 ? `${(value/1000).toFixed(0)}k` : '0'}
                      width={40}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(30 25% 98% / 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid hsl(0 0% 100% / 0.3)',
                        borderRadius: '16px',
                        fontFamily: 'Inter',
                        fontSize: '13px',
                        boxShadow: '0 8px 32px hsl(0 0% 0% / 0.1)'
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="hsl(16 60% 50%)" 
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                      dot={false}
                      activeDot={{ 
                        r: 6, 
                        fill: 'hsl(16 60% 50%)',
                        stroke: 'hsl(0 0% 100%)',
                        strokeWidth: 2
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            variants={itemVariants}
            className="liquid-glass-card p-6"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="glass-icon glass-icon-sm bg-gradient-to-br from-secondary to-muted/50">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <h2 className="font-display text-lg font-medium">Atividade</h2>
              </div>
              
              <div className="space-y-2">
                {activities.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="glass-icon glass-icon-lg mx-auto mb-4 bg-muted/30">
                      <Clock className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <p className="font-body text-sm text-muted-foreground">
                      Nenhuma atividade recente
                    </p>
                  </div>
                ) : (
                  activities.map((activity, idx) => (
                    <motion.div 
                      key={activity.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors duration-200"
                    >
                      <div className="glass-icon glass-icon-sm">
                        <activity.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-foreground truncate">
                          {activity.message}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          {activity.time} atrás
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <motion.div
            variants={itemVariants}
            className="liquid-glass-card p-6"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="glass-icon glass-icon-sm">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-display text-lg font-medium">Pedidos Recentes</h2>
              </div>
              
              {recentOrders.length === 0 ? (
                <div className="text-center py-10">
                  <div className="glass-icon glass-icon-lg mx-auto mb-4 bg-muted/30">
                    <ShoppingCart className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="font-body text-sm text-muted-foreground">
                    Nenhum pedido ainda
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentOrders.map((order, idx) => {
                    const badge = getStatusBadge(order.status);
                    return (
                      <motion.div 
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-colors duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-medium truncate">
                            {order.profiles?.full_name || 'Cliente'}
                          </p>
                          <p className="font-body text-xs text-muted-foreground">
                            #{order.id.slice(0, 8)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={badge.class}>
                            {badge.label}
                          </span>
                          <span className="font-display text-sm font-semibold">
                            R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Stock Alerts */}
          <motion.div
            variants={itemVariants}
            className="liquid-glass-card p-6"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="glass-icon glass-icon-sm bg-gradient-to-br from-amber-500/20 to-orange-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-display text-lg font-medium">Alertas de Estoque</h2>
              </div>
              
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="glass-icon glass-icon-lg mx-auto mb-4 bg-green-500/10">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-body text-sm text-muted-foreground">
                    Estoque em dia
                  </p>
                  <p className="font-body text-xs text-green-600 mt-1">
                    Todos os produtos com estoque adequado
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {lowStockProducts.map((product, idx) => (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-colors duration-200"
                    >
                      <p className="font-body text-sm truncate flex-1 pr-4">
                        {product.name}
                      </p>
                      <span className={
                        product.stock_quantity === 0 
                          ? 'glass-badge glass-badge-danger' 
                          : 'glass-badge glass-badge-warning'
                      }>
                        {product.stock_quantity === 0 ? 'Esgotado' : `${product.stock_quantity} un`}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Dashboard;