import { useState, useEffect } from "react";
import { FileSpreadsheet, Download, Calendar, Users, ShoppingCart, Tag, Package, TrendingUp, Percent, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/price-utils";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/lib/export-utils";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

type DatePreset = 'today' | '7days' | '30days' | 'this_month' | 'last_month' | 'this_year' | 'custom';

const datePresets: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: 'Últimos 7 dias' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
  { value: 'this_year', label: 'Este ano' },
  { value: 'custom', label: 'Personalizado' },
];

const getDateRangeForPreset = (preset: DatePreset): { start: Date; end: Date } => {
  const today = new Date();
  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case '7days':
      return { start: subDays(today, 7), end: today };
    case '30days':
      return { start: subDays(today, 30), end: today };
    case 'this_month':
      return { start: startOfMonth(today), end: endOfMonth(today) };
    case 'last_month':
      const lastMonth = subDays(startOfMonth(today), 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case 'this_year':
      return { start: startOfYear(today), end: today };
    default:
      return { start: startOfMonth(today), end: endOfMonth(today) };
  }
};

const statusLabels: Record<string, string> = {
  created: 'Criado',
  pending_payment: 'Aguardando',
  paid: 'Pago',
  packing: 'Embalando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export default function Relatorios() {
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [salesData, setSalesData] = useState<any[]>([]);
  const [clientsData, setClientsData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [couponsData, setCouponsData] = useState<any[]>([]);

  // Get effective date range
  const getEffectiveDateRange = () => {
    if (datePreset === 'custom' && customRange?.from) {
      return {
        start: format(customRange.from, 'yyyy-MM-dd'),
        end: format(customRange.to || customRange.from, 'yyyy-MM-dd'),
      };
    }
    const range = getDateRangeForPreset(datePreset);
    return {
      start: format(range.start, 'yyyy-MM-dd'),
      end: format(range.end, 'yyyy-MM-dd'),
    };
  };

  const { start: startDate, end: endDate } = getEffectiveDateRange();

  const loadSales = async () => {
    setLoading(true);
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          unit_price,
          total_price,
          product_id,
          products (name, sku)
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (!error && orders) {
      // Get customer names
      const userIds = [...new Set(orders.map(o => o.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const enrichedOrders = orders.map(order => ({
        ...order,
        customer: profileMap.get(order.user_id) || null,
      }));
      
      setSalesData(enrichedOrders);
    }
    setLoading(false);
  };

  const loadClients = async () => {
    setLoading(true);
    
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && profiles) {
      // Get orders for each customer
      const userIds = profiles.map(p => p.user_id);
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total, status, created_at')
        .in('user_id', userIds);
      
      // Aggregate orders by user
      const orderStats = new Map<string, { orderCount: number; totalSpent: number; lastOrder: string | null }>();
      orders?.forEach(order => {
        const existing = orderStats.get(order.user_id) || { orderCount: 0, totalSpent: 0, lastOrder: null };
        existing.orderCount++;
        if (order.status !== 'cancelled') {
          existing.totalSpent += Number(order.total);
        }
        if (!existing.lastOrder || order.created_at > existing.lastOrder) {
          existing.lastOrder = order.created_at;
        }
        orderStats.set(order.user_id, existing);
      });

      const enrichedClients = profiles.map(client => ({
        ...client,
        orderCount: orderStats.get(client.user_id)?.orderCount || 0,
        totalSpent: orderStats.get(client.user_id)?.totalSpent || 0,
        lastOrder: orderStats.get(client.user_id)?.lastOrder || null,
        // Extract preferences
        cpf: (client.preferences as any)?.cpf || null,
        birthDate: (client.preferences as any)?.birth_date || null,
        isManual: (client.preferences as any)?.is_manual_customer || false,
      }));
      
      setClientsData(enrichedClients);
    }
    setLoading(false);
  };

  const loadProducts = async () => {
    setLoading(true);
    
    // Get all order items within date range
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        unit_price,
        total_price,
        created_at,
        products (id, name, sku, price, cost_price, stock_quantity, category, brand)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    if (!error && orderItems) {
      // Aggregate by product
      const aggregated: Record<string, { 
        name: string; 
        sku: string | null;
        category: string;
        brand: string | null;
        quantity: number; 
        revenue: number; 
        stock: number;
        price: number;
        costPrice: number;
        profit: number;
        avgPrice: number;
      }> = {};
      
      orderItems.forEach(item => {
        const product = item.products as any;
        const productId = item.product_id;
        const costPrice = Number(product?.cost_price) || 0;
        const itemProfit = (Number(item.unit_price) - costPrice) * item.quantity;
        
        if (!aggregated[productId]) {
          aggregated[productId] = {
            name: product?.name || 'Produto removido',
            sku: product?.sku || null,
            category: product?.category || '-',
            brand: product?.brand || '-',
            quantity: 0,
            revenue: 0,
            stock: product?.stock_quantity || 0,
            price: Number(product?.price) || 0,
            costPrice,
            profit: 0,
            avgPrice: 0,
          };
        }
        aggregated[productId].quantity += item.quantity;
        aggregated[productId].revenue += Number(item.total_price);
        aggregated[productId].profit += itemProfit;
      });

      // Calculate avg price
      Object.values(aggregated).forEach(p => {
        p.avgPrice = p.quantity > 0 ? p.revenue / p.quantity : 0;
      });

      setProductsData(Object.entries(aggregated).map(([id, data]) => ({ id, ...data })));
    }
    setLoading(false);
  };

  const loadCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupon_uses')
      .select(`
        *,
        coupons (code, discount_type, discount_value, max_uses, current_uses)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (!error) {
      setCouponsData(data || []);
    }
    setLoading(false);
  };

  // Enhanced exports
  const handleExportClients = () => {
    const dataToExport = clientsData.map(c => ({
      Nome: c.full_name || '-',
      Telefone: c.phone || '-',
      CPF: c.cpf || '-',
      'Data Nascimento': c.birthDate || '-',
      'Total Pedidos': c.orderCount,
      'Total Gasto': formatCurrencyForExport(c.totalSpent),
      'Último Pedido': c.lastOrder ? formatDateForExport(c.lastOrder) : '-',
      'Cliente Manual': c.isManual ? 'Sim' : 'Não',
      'Cadastro': formatDateForExport(c.created_at)
    }));
    exportToCSV(dataToExport, `clientes-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success("Clientes exportados!");
  };

  const handleExportSales = () => {
    const dataToExport = salesData.map(s => ({
      Pedido: s.id.slice(0, 8),
      Cliente: s.customer?.full_name || '-',
      Telefone: s.customer?.phone || '-',
      Status: statusLabels[s.status] || s.status,
      'Forma Pagamento': s.payment_method || '-',
      Origem: s.origin || 'site',
      Itens: s.order_items?.length || 0,
      Subtotal: formatCurrencyForExport(Number(s.subtotal)),
      Desconto: formatCurrencyForExport(Number(s.discount_total) || 0),
      Frete: formatCurrencyForExport(Number(s.shipping_cost)),
      Total: formatCurrencyForExport(Number(s.total)),
      Observações: s.notes || '-',
      Data: formatDateForExport(s.created_at)
    }));
    exportToCSV(dataToExport, `vendas-${startDate}-a-${endDate}`);
    toast.success("Vendas exportadas!");
  };

  const handleExportProducts = () => {
    const dataToExport = productsData.sort((a, b) => b.quantity - a.quantity).map(p => ({
      Produto: p.name,
      SKU: p.sku || '-',
      Categoria: p.category,
      Marca: p.brand || '-',
      'Qtd Vendida': p.quantity,
      'Preço Médio': formatCurrencyForExport(p.avgPrice),
      Receita: formatCurrencyForExport(p.revenue),
      'Custo Unit.': formatCurrencyForExport(p.costPrice),
      Lucro: formatCurrencyForExport(p.profit),
      'Margem %': p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) + '%' : '0%',
      'Estoque Atual': p.stock
    }));
    exportToCSV(dataToExport, `produtos-${startDate}-a-${endDate}`);
    toast.success("Produtos exportados!");
  };

  const handleExportCoupons = () => {
    const dataToExport = couponsData.map(use => ({
      Código: (use.coupons as any)?.code || '-',
      Tipo: (use.coupons as any)?.discount_type === 'percentage' ? 'Percentual' : 'Valor fixo',
      'Valor Desconto': formatCurrencyForExport(Number(use.discount_applied)),
      'Usos / Máximo': `${(use.coupons as any)?.current_uses || 0} / ${(use.coupons as any)?.max_uses || '∞'}`,
      Data: formatDateForExport(use.created_at)
    }));
    exportToCSV(dataToExport, `cupons-${startDate}-a-${endDate}`);
    toast.success("Cupons exportados!");
  };

  // Stats calculations
  const totalSales = salesData.reduce((sum, s) => sum + Number(s.total), 0);
  const paidOrders = salesData.filter(s => ['paid', 'delivered', 'shipped', 'packing'].includes(s.status));
  const totalPaid = paidOrders.reduce((sum, s) => sum + Number(s.total), 0);
  const cancelledOrders = salesData.filter(s => s.status === 'cancelled');
  const avgTicket = paidOrders.length > 0 ? totalPaid / paidOrders.length : 0;

  const totalProductsSold = productsData.reduce((sum, p) => sum + p.quantity, 0);
  const totalProductRevenue = productsData.reduce((sum, p) => sum + p.revenue, 0);
  const totalProductProfit = productsData.reduce((sum, p) => sum + p.profit, 0);

  const totalCouponDiscount = couponsData.reduce((sum, c) => sum + Number(c.discount_applied), 0);

  return (
    <AdminLayout title="Relatórios">
      <div className="space-y-6">
        {/* Date Filter */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {datePresets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {datePreset === 'custom' && (
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      {customRange?.from ? (
                        customRange.to ? (
                          `${format(customRange.from, 'dd/MM/yy')} - ${format(customRange.to, 'dd/MM/yy')}`
                        ) : (
                          format(customRange.from, 'dd/MM/yyyy')
                        )
                      ) : (
                        'Selecionar datas'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={customRange}
                      onSelect={setCustomRange}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}

              <div className="text-sm text-muted-foreground">
                {format(parseISO(startDate), "dd 'de' MMMM", { locale: ptBR })} até {format(parseISO(endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="sales" onValueChange={(v) => {
          if (v === 'sales') loadSales();
          else if (v === 'clients') loadClients();
          else if (v === 'products') loadProducts();
          else if (v === 'coupons') loadCoupons();
        }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Cupons</span>
            </TabsTrigger>
          </TabsList>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <ShoppingCart className="w-3 h-3" />
                  Total de Pedidos
                </div>
                <p className="text-2xl font-bold">{salesData.length}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  Receita Total
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Percent className="w-3 h-3" />
                  Ticket Médio
                </div>
                <p className="text-2xl font-bold">{formatCurrency(avgTicket)}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="w-3 h-3" />
                  Cancelados
                </div>
                <p className="text-2xl font-bold text-destructive">{cancelledOrders.length}</p>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportSales} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.slice(0, 100).map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{order.customer?.full_name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{order.customer?.phone || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ['paid', 'delivered'].includes(order.status) 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                              : order.status === 'cancelled'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted'
                          }`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{order.payment_method || '-'}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            order.origin === 'manual' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {order.origin === 'manual' ? 'Manual' : 'Site'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(order.total))}
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(order.created_at), 'dd/MM/yy HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Total de Clientes</div>
                <p className="text-2xl font-bold">{clientsData.length}</p>
              </Card>
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Clientes Manuais</div>
                <p className="text-2xl font-bold">{clientsData.filter(c => c.isManual).length}</p>
              </Card>
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Com Pedidos</div>
                <p className="text-2xl font-bold text-emerald-600">{clientsData.filter(c => c.orderCount > 0).length}</p>
              </Card>
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Total Faturado</div>
                <p className="text-2xl font-bold">{formatCurrency(clientsData.reduce((sum, c) => sum + c.totalSpent, 0))}</p>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportClients} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead className="text-right">Pedidos</TableHead>
                      <TableHead className="text-right">Total Gasto</TableHead>
                      <TableHead>Último Pedido</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsData.map(client => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.full_name || '-'}</TableCell>
                        <TableCell>{client.phone || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{client.cpf || '-'}</TableCell>
                        <TableCell className="text-right">{client.orderCount}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {formatCurrency(client.totalSpent)}
                        </TableCell>
                        <TableCell>
                          {client.lastOrder ? format(new Date(client.lastOrder), 'dd/MM/yy') : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            client.isManual 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {client.isManual ? 'Manual' : 'Site'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(client.created_at), 'dd/MM/yy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Produtos Vendidos</div>
                <p className="text-2xl font-bold">{productsData.length}</p>
              </Card>
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Unidades Vendidas</div>
                <p className="text-2xl font-bold">{totalProductsSold}</p>
              </Card>
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Receita Total</div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalProductRevenue)}</p>
              </Card>
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Lucro Bruto</div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalProductProfit)}</p>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportProducts} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsData.sort((a, b) => b.revenue - a.revenue).map(product => {
                      const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="font-mono text-xs">{product.sku || '-'}</TableCell>
                          <TableCell className="text-sm">{product.category}</TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(product.revenue)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {formatCurrency(product.profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-medium ${
                              margin >= 30 ? 'text-emerald-600' : margin >= 15 ? 'text-amber-600' : 'text-destructive'
                            }`}>
                              {margin.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={product.stock < 5 ? 'text-destructive font-medium' : ''}>
                              {product.stock}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Cupons Utilizados</div>
                <p className="text-2xl font-bold">{couponsData.length}</p>
              </Card>
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Total em Descontos</div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalCouponDiscount)}</p>
              </Card>
              <Card className="p-4">
                <div className="text-muted-foreground text-xs mb-1">Desconto Médio</div>
                <p className="text-2xl font-bold">
                  {couponsData.length > 0 ? formatCurrency(totalCouponDiscount / couponsData.length) : 'R$ 0'}
                </p>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleExportCoupons} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : couponsData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum cupom utilizado no período</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Desconto Aplicado</TableHead>
                      <TableHead>Usos / Máximo</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {couponsData.map(use => (
                      <TableRow key={use.id}>
                        <TableCell className="font-mono font-medium">
                          {(use.coupons as any)?.code || '-'}
                        </TableCell>
                        <TableCell>
                          {(use.coupons as any)?.discount_type === 'percentage' ? 'Percentual' : 'Valor fixo'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(Number(use.discount_applied))}
                        </TableCell>
                        <TableCell>
                          {(use.coupons as any)?.current_uses || 0} / {(use.coupons as any)?.max_uses || '∞'}
                        </TableCell>
                        <TableCell>{format(new Date(use.created_at), 'dd/MM/yy HH:mm')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}