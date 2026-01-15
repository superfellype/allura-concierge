import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock,
  AlertTriangle,
  Sparkles,
  Eye,
  Receipt,
  Target,
  Zap,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { expensesService } from "@/services/expenses.service";

interface KPICard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  color: "primary" | "success" | "warning" | "info" | "purple";
  href?: string;
}

interface RevenueData {
  name: string;
  receita: number;
  pedidos: number;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const colorClasses = {
  primary: {
    bg: "bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5",
    icon: "text-primary",
    badge: "bg-primary/10 text-primary"
  },
  success: {
    bg: "bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-emerald-500/5",
    icon: "text-emerald-600",
    badge: "bg-emerald-500/10 text-emerald-600"
  },
  warning: {
    bg: "bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-amber-500/5",
    icon: "text-amber-600",
    badge: "bg-amber-500/10 text-amber-600"
  },
  info: {
    bg: "bg-gradient-to-br from-sky-500/15 via-sky-500/10 to-sky-500/5",
    icon: "text-sky-600",
    badge: "bg-sky-500/10 text-sky-600"
  },
  purple: {
    bg: "bg-gradient-to-br from-violet-500/15 via-violet-500/10 to-violet-500/5",
    icon: "text-violet-600",
    badge: "bg-violet-500/10 text-violet-600"
  }
};

const Dashboard = () => {
  const [kpis, setKpis] = useState<KPICard[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseStats, setExpenseStats] = useState({ totalMonth: 0, totalLastMonth: 0, byCategory: {} as Record<string, number> });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchKPIs(),
      fetchRecentOrders(),
      fetchRevenueData(),
      fetchLowStock(),
      fetchTopProducts(),
      fetchExpenseStats(),
    ]);
    setLoading(false);
  };

  const fetchExpenseStats = async () => {
    const stats = await expensesService.getStats();
    setExpenseStats(stats);
  };

  const fetchKPIs = async () => {
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

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const todayOrders = orders?.filter(o => 
      new Date(o.created_at).toDateString() === todayStr
    ) || [];

    const yesterdayOrders = orders?.filter(o => 
      new Date(o.created_at).toDateString() === yesterdayStr
    ) || [];

    const todayOrdersCount = todayOrders.length;
    const yesterdayOrdersCount = yesterdayOrders.length;
    const ordersChange = yesterdayOrdersCount > 0 
      ? Math.round(((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) * 100)
      : todayOrdersCount > 0 ? 100 : 0;

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
      : monthlyRevenue > 0 ? 100 : 0;

    // Net revenue uses expenseStats loaded separately
    const netRevenue = monthlyRevenue - expenseStats.totalMonth;

    // Average ticket
    const paidOrders = orders?.filter(o => o.status !== 'cancelled' && o.status !== 'created') || [];
    const averageTicket = paidOrders.length > 0 
      ? paidOrders.reduce((sum, o) => sum + Number(o.total), 0) / paidOrders.length
      : 0;

    // Calculate last month average ticket for comparison
    const lastMonthPaidOrders = orders?.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && o.status !== 'cancelled' && o.status !== 'created';
    }) || [];
    const lastMonthAvgTicket = lastMonthPaidOrders.length > 0
      ? lastMonthPaidOrders.reduce((sum, o) => sum + Number(o.total), 0) / lastMonthPaidOrders.length
      : 0;
    const ticketChange = lastMonthAvgTicket > 0
      ? Math.round(((averageTicket - lastMonthAvgTicket) / lastMonthAvgTicket) * 100)
      : averageTicket > 0 ? 100 : 0;

    setKpis([
      { 
        title: "Pedidos Hoje", 
        value: String(todayOrdersCount), 
        change: ordersChange,
        changeLabel: "vs ontem",
        icon: ShoppingCart, 
        color: "primary",
        href: "/admin/pedidos"
      },
      { 
        title: "Receita Mensal", 
        value: `R$ ${monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
        change: revenueChange,
        changeLabel: "vs mês anterior",
        icon: TrendingUp,
        color: "success",
        href: "/admin/relatorios"
      },
      { 
        title: "Ticket Médio", 
        value: `R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
        change: ticketChange,
        changeLabel: "vs mês anterior",
        icon: Target, 
        color: "purple",
      },
      { 
        title: "Clientes Ativos", 
        value: String(customersCount || 0), 
        change: 0,
        changeLabel: "total",
        icon: Users, 
        color: "info",
        href: "/admin/clientes"
      },
      { 
        title: "Produtos Ativos", 
        value: String(productsCount || 0), 
        change: 0,
        changeLabel: "no catálogo",
        icon: Package, 
        color: "warning",
        href: "/admin/produtos"
      },
      { 
        title: "Receita Líquida", 
        value: `R$ ${netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 
        change: revenueChange,
        changeLabel: "após despesas",
        icon: DollarSign,
        color: "success",
        href: "/admin/despesas"
      },
    ]);
  };

  const fetchRecentOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, total, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(6);

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

  const fetchTopProducts = async () => {
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, unit_price");

    if (orderItems) {
      const productSales: Record<string, { sales: number; revenue: number }> = {};
      orderItems.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { sales: 0, revenue: 0 };
        }
        productSales[item.product_id].sales += item.quantity;
        productSales[item.product_id].revenue += Number(item.unit_price) * item.quantity;
      });

      const productIds = Object.keys(productSales);
      if (productIds.length === 0) {
        setTopProducts([]);
        return;
      }
      
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      if (products) {
        const topProds = products
          .map(p => ({
            id: p.id,
            name: p.name,
            sales: productSales[p.id]?.sales || 0,
            revenue: productSales[p.id]?.revenue || 0,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setTopProducts(topProds);
      }
    }
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
      created: { class: "bg-muted text-muted-foreground", label: "Criado" },
      pending_payment: { class: "bg-amber-500/10 text-amber-600", label: "Aguardando" },
      paid: { class: "bg-emerald-500/10 text-emerald-600", label: "Pago" },
      packing: { class: "bg-sky-500/10 text-sky-600", label: "Embalando" },
      shipped: { class: "bg-violet-500/10 text-violet-600", label: "Enviado" },
      delivered: { class: "bg-emerald-500/10 text-emerald-600", label: "Entregue" },
      cancelled: { class: "bg-destructive/10 text-destructive", label: "Cancelado" },
    };
    return badges[status] || { class: "bg-muted text-muted-foreground", label: status };
  };

  return (
    <AdminLayout title="Dashboard">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shadow-lg shadow-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">Bem-vindo de volta</h2>
              <p className="font-body text-sm text-muted-foreground">
                Aqui está o resumo da sua loja
              </p>
            </div>
          </div>
          <Link 
            to="/admin/relatorios"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Ver Relatórios
          </Link>
        </motion.div>

        {/* KPI Cards - Bento Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi, index) => {
            const colors = colorClasses[kpi.color];
            const CardWrapper = kpi.href ? Link : 'div';
            const cardProps = kpi.href ? { to: kpi.href } : {};
            
            return (
              <motion.div
                key={kpi.title}
                variants={itemVariants}
              >
                <CardWrapper 
                  {...cardProps as any}
                  className={`block p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl hover:bg-card/80 hover:border-border/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group ${kpi.href ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <kpi.icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    {kpi.change !== 0 && (
                      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
                        kpi.change > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {kpi.change > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {Math.abs(kpi.change)}%
                      </div>
                    )}
                  </div>
                  <p className="font-display text-2xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {kpi.value}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {kpi.title}
                  </p>
                </CardWrapper>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Grid - Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Chart - Takes 8 columns */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-8 p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Receita</h2>
                  <p className="font-body text-xs text-muted-foreground">Últimos 7 dias</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="font-body text-xs text-muted-foreground">Vendas</span>
              </div>
            </div>
            <div className="h-64">
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
                    strokeOpacity={0.3}
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
                      background: 'hsl(var(--card))',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
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
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Products - 4 columns */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-4 p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-violet-600" />
                </div>
                <h2 className="font-display text-lg font-semibold">Top Produtos</h2>
              </div>
              <Link to="/admin/produtos" className="text-primary text-xs font-medium hover:underline">
                Ver todos
              </Link>
            </div>
            
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">
                  Nenhuma venda ainda
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-display font-bold text-sm text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium truncate">
                        {product.name}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {product.sales} vendidos
                      </p>
                    </div>
                    <p className="font-display text-sm font-semibold text-emerald-600">
                      R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Recent Orders */}
          <motion.div
            variants={itemVariants}
            className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-lg font-semibold">Pedidos Recentes</h2>
              </div>
              <Link to="/admin/pedidos" className="text-primary text-xs font-medium hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-body text-sm text-muted-foreground">
                  Nenhum pedido ainda
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.slice(0, 5).map((order, idx) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium truncate">
                          {order.profiles?.full_name || 'Cliente'}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          {formatTimeAgo(new Date(order.created_at))} atrás
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${badge.class}`}>
                          {badge.label}
                        </span>
                        <span className="font-display text-sm font-semibold min-w-[70px] text-right">
                          R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Expenses Summary Card */}
          <motion.div
            variants={itemVariants}
            className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/15 to-rose-500/5 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-rose-600" />
                </div>
                <h2 className="font-display text-lg font-semibold">Despesas</h2>
              </div>
              <Link to="/admin/despesas" className="text-primary text-xs font-medium hover:underline flex items-center gap-1">
                Gerenciar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20">
                <p className="font-body text-xs text-muted-foreground mb-1">Este mês</p>
                <p className="font-display text-2xl font-bold text-rose-600">
                  R$ {expenseStats.totalMonth.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
                {expenseStats.totalLastMonth > 0 && (
                  <div className={`flex items-center gap-1 text-xs mt-1 ${
                    expenseStats.totalMonth > expenseStats.totalLastMonth 
                      ? 'text-rose-600' 
                      : 'text-emerald-600'
                  }`}>
                    {expenseStats.totalMonth > expenseStats.totalLastMonth ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(((expenseStats.totalMonth - expenseStats.totalLastMonth) / expenseStats.totalLastMonth) * 100).toFixed(0)}% vs mês anterior
                  </div>
                )}
              </div>

              {Object.keys(expenseStats.byCategory).length > 0 && (
                <div className="space-y-2">
                  <p className="font-body text-xs text-muted-foreground">Por categoria</p>
                  {Object.entries(expenseStats.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="font-body text-sm">{category}</span>
                        <span className="font-body text-sm font-medium">
                          R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            variants={itemVariants}
            className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/15 to-sky-500/5 flex items-center justify-center">
                <Zap className="w-5 h-5 text-sky-600" />
              </div>
              <h2 className="font-display text-lg font-semibold">Ações Rápidas</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/admin/venda-manual" 
                className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all group"
              >
                <DollarSign className="w-6 h-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-body text-sm font-medium">Nova Venda</p>
              </Link>
              <Link 
                to="/admin/produtos/novo" 
                className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
              >
                <Package className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-body text-sm font-medium">Novo Produto</p>
              </Link>
              <Link 
                to="/admin/despesas" 
                className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all group"
              >
                <Receipt className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-body text-sm font-medium">Despesas</p>
              </Link>
              <Link 
                to="/admin/clientes" 
                className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 hover:border-violet-500/40 transition-all group"
              >
                <Users className="w-6 h-6 text-violet-600 mb-2 group-hover:scale-110 transition-transform" />
                <p className="font-body text-sm font-medium">Clientes</p>
              </Link>
            </div>
          </motion.div>

          {/* Stock Alerts */}
          <motion.div
            variants={itemVariants}
            className="p-6 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="font-display text-lg font-semibold">Alertas de Estoque</h2>
              </div>
              <Link to="/admin/estoque" className="text-primary text-xs font-medium hover:underline">
                Gerenciar
              </Link>
            </div>
            
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 mx-auto mb-3 flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-body text-sm font-medium text-emerald-600">
                  Estoque em dia!
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1">
                  Todos os produtos com estoque adequado
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((product, idx) => (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-body text-sm truncate flex-1 pr-4">
                      {product.name}
                    </p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                      product.stock_quantity === 0 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {product.stock_quantity === 0 ? 'Esgotado' : `${product.stock_quantity} un`}
                    </span>
                  </motion.div>
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
