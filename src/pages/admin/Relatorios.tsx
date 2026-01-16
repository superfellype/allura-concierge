import { useState, useEffect, useMemo } from "react";
import { FileSpreadsheet, Download, Calendar, Users, ShoppingCart, Tag, Package, TrendingUp, Percent, Clock, Settings2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
import { formatDateForExport, formatCurrencyForExport } from "@/lib/export-utils";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { ExportModal, ExportColumn, useExportModal } from "@/components/admin/ExportModal";
import { ReportFilters, FilterConfig } from "@/components/admin/ReportFilters";

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

const statusOptions = [
  { value: 'created', label: 'Criado' },
  { value: 'pending_payment', label: 'Aguardando' },
  { value: 'paid', label: 'Pago' },
  { value: 'packing', label: 'Embalando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
];

const originOptions = [
  { value: 'site', label: 'Site' },
  { value: 'manual', label: 'Manual' },
];

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export default function Relatorios() {
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  
  const [salesData, setSalesData] = useState<any[]>([]);
  const [clientsData, setClientsData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [couponsData, setCouponsData] = useState<any[]>([]);

  // Filters state
  const [salesFilters, setSalesFilters] = useState<Record<string, any>>({});
  const [clientsFilters, setClientsFilters] = useState<Record<string, any>>({});
  const [productsFilters, setProductsFilters] = useState<Record<string, any>>({});
  const [couponsFilters, setCouponsFilters] = useState<Record<string, any>>({});

  // Sort state
  const [salesSort, setSalesSort] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [productsSort, setProductsSort] = useState<SortConfig>({ key: 'revenue', direction: 'desc' });
  const [clientsSort, setClientsSort] = useState<SortConfig>({ key: 'totalSpent', direction: 'desc' });

  // Export modals
  const salesExport = useExportModal();
  const clientsExport = useExportModal();
  const productsExport = useExportModal();
  const couponsExport = useExportModal();

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

  // Filter configs
  const salesFilterConfig: FilterConfig[] = [
    { key: 'search', type: 'search', label: 'Busca', placeholder: 'Buscar por cliente, pedido...' },
    { key: 'status', type: 'select', label: 'Status', options: statusOptions },
    { key: 'origin', type: 'select', label: 'Origem', options: originOptions },
    { key: 'paymentMethod', type: 'multiselect', label: 'Forma de Pagamento', options: [
      { value: 'pix', label: 'PIX' },
      { value: 'credit_card', label: 'Cartão de Crédito' },
      { value: 'boleto', label: 'Boleto' },
      { value: 'cash', label: 'Dinheiro' },
    ]},
  ];

  const clientsFilterConfig: FilterConfig[] = [
    { key: 'search', type: 'search', label: 'Busca', placeholder: 'Buscar por nome, telefone, CPF...' },
    { key: 'type', type: 'select', label: 'Tipo', options: [
      { value: 'manual', label: 'Manual' },
      { value: 'site', label: 'Site' },
    ]},
    { key: 'hasOrders', type: 'select', label: 'Pedidos', options: [
      { value: 'yes', label: 'Com pedidos' },
      { value: 'no', label: 'Sem pedidos' },
    ]},
  ];

  const productsFilterConfig: FilterConfig[] = [
    { key: 'search', type: 'search', label: 'Busca', placeholder: 'Buscar produto, SKU...' },
    { key: 'brand', type: 'multiselect', label: 'Marca', options: [
      { value: 'VeryRio', label: 'VeryRio' },
      { value: 'Chalita', label: 'Chalita' },
      { value: 'LaytonVivian', label: 'LaytonVivian' },
      { value: 'Outro', label: 'Outro' },
    ]},
  ];

  const couponsFilterConfig: FilterConfig[] = [
    { key: 'search', type: 'search', label: 'Busca', placeholder: 'Buscar código...' },
    { key: 'type', type: 'select', label: 'Tipo', options: [
      { value: 'percentage', label: 'Percentual' },
      { value: 'fixed', label: 'Valor fixo' },
    ]},
  ];

  // Export columns
  const salesExportColumns: ExportColumn[] = [
    { key: 'id', label: 'ID Pedido', format: (v) => v?.slice(0, 8) || '-' },
    { key: 'customerName', label: 'Cliente' },
    { key: 'customerPhone', label: 'Telefone' },
    { key: 'status', label: 'Status', format: (v) => statusLabels[v] || v },
    { key: 'payment_method', label: 'Forma de Pagamento' },
    { key: 'origin', label: 'Origem' },
    { key: 'itemsCount', label: 'Qtd Itens' },
    { key: 'subtotal', label: 'Subtotal', format: (v) => formatCurrencyForExport(Number(v) || 0) },
    { key: 'discount_total', label: 'Desconto', format: (v) => formatCurrencyForExport(Number(v) || 0) },
    { key: 'shipping_cost', label: 'Frete', format: (v) => formatCurrencyForExport(Number(v) || 0) },
    { key: 'total', label: 'Total', format: (v) => formatCurrencyForExport(Number(v) || 0) },
    { key: 'notes', label: 'Observações' },
    { key: 'created_at', label: 'Data', format: (v) => formatDateForExport(v) },
  ];

  const clientsExportColumns: ExportColumn[] = [
    { key: 'full_name', label: 'Nome' },
    { key: 'phone', label: 'Telefone' },
    { key: 'cpf', label: 'CPF' },
    { key: 'birthDate', label: 'Data de Nascimento' },
    { key: 'orderCount', label: 'Total de Pedidos' },
    { key: 'totalSpent', label: 'Total Gasto', format: (v) => formatCurrencyForExport(v || 0) },
    { key: 'lastOrder', label: 'Último Pedido', format: (v) => v ? formatDateForExport(v) : '-' },
    { key: 'isManual', label: 'Cliente Manual', format: (v) => v ? 'Sim' : 'Não' },
    { key: 'created_at', label: 'Data Cadastro', format: (v) => formatDateForExport(v) },
  ];

  const productsExportColumns: ExportColumn[] = [
    { key: 'name', label: 'Produto' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Categoria' },
    { key: 'brand', label: 'Marca' },
    { key: 'quantity', label: 'Qtd Vendida' },
    { key: 'avgPrice', label: 'Preço Médio', format: (v) => formatCurrencyForExport(v || 0) },
    { key: 'revenue', label: 'Receita', format: (v) => formatCurrencyForExport(v || 0) },
    { key: 'costPrice', label: 'Custo Unitário', format: (v) => formatCurrencyForExport(v || 0) },
    { key: 'profit', label: 'Lucro', format: (v) => formatCurrencyForExport(v || 0) },
    { key: 'margin', label: 'Margem %', format: (v) => `${(v || 0).toFixed(1)}%` },
    { key: 'stock', label: 'Estoque Atual' },
  ];

  const couponsExportColumns: ExportColumn[] = [
    { key: 'code', label: 'Código' },
    { key: 'discountType', label: 'Tipo', format: (v) => v === 'percentage' ? 'Percentual' : 'Valor fixo' },
    { key: 'discount_applied', label: 'Desconto Aplicado', format: (v) => formatCurrencyForExport(Number(v) || 0) },
    { key: 'currentUses', label: 'Usos Atuais' },
    { key: 'maxUses', label: 'Máximo de Usos', format: (v) => v || '∞' },
    { key: 'created_at', label: 'Data', format: (v) => formatDateForExport(v) },
  ];

  // Load functions
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
      const userIds = [...new Set(orders.map(o => o.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const enrichedOrders = orders.map(order => ({
        ...order,
        customer: profileMap.get(order.user_id) || null,
        customerName: profileMap.get(order.user_id)?.full_name || '-',
        customerPhone: profileMap.get(order.user_id)?.phone || '-',
        itemsCount: order.order_items?.length || 0,
      }));
      
      setSalesData(enrichedOrders);
    }
    setLoading(false);
  };

  const loadClients = async () => {
    setLoading(true);
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && profiles) {
      const userIds = profiles.map(p => p.user_id);
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total, status, created_at')
        .in('user_id', userIds);
      
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
        margin: number;
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
            margin: 0,
          };
        }
        aggregated[productId].quantity += item.quantity;
        aggregated[productId].revenue += Number(item.total_price);
        aggregated[productId].profit += itemProfit;
      });

      Object.values(aggregated).forEach(p => {
        p.avgPrice = p.quantity > 0 ? p.revenue / p.quantity : 0;
        p.margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
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
      const enrichedCoupons = (data || []).map(use => ({
        ...use,
        code: (use.coupons as any)?.code || '-',
        discountType: (use.coupons as any)?.discount_type,
        currentUses: (use.coupons as any)?.current_uses || 0,
        maxUses: (use.coupons as any)?.max_uses,
      }));
      setCouponsData(enrichedCoupons);
    }
    setLoading(false);
  };

  // Filter and sort data
  const filteredSales = useMemo(() => {
    let result = [...salesData];
    
    // Apply filters
    const { search, status, origin, paymentMethod } = salesFilters;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(s => 
        s.customerName?.toLowerCase().includes(searchLower) ||
        s.id?.toLowerCase().includes(searchLower) ||
        s.customerPhone?.includes(search)
      );
    }
    if (status && status !== 'all') {
      result = result.filter(s => s.status === status);
    }
    if (origin && origin !== 'all') {
      result = result.filter(s => s.origin === origin);
    }
    if (paymentMethod && paymentMethod.length > 0) {
      result = result.filter(s => paymentMethod.includes(s.payment_method));
    }

    // Apply sort
    if (salesSort) {
      result.sort((a, b) => {
        const aVal = a[salesSort.key];
        const bVal = b[salesSort.key];
        const multiplier = salesSort.direction === 'asc' ? 1 : -1;
        if (typeof aVal === 'number') return (aVal - bVal) * multiplier;
        return String(aVal || '').localeCompare(String(bVal || '')) * multiplier;
      });
    }

    return result;
  }, [salesData, salesFilters, salesSort]);

  const filteredClients = useMemo(() => {
    let result = [...clientsData];
    
    const { search, type, hasOrders } = clientsFilters;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(c => 
        c.full_name?.toLowerCase().includes(searchLower) ||
        c.phone?.includes(search) ||
        c.cpf?.includes(search)
      );
    }
    if (type && type !== 'all') {
      if (type === 'manual') result = result.filter(c => c.isManual);
      else result = result.filter(c => !c.isManual);
    }
    if (hasOrders && hasOrders !== 'all') {
      if (hasOrders === 'yes') result = result.filter(c => c.orderCount > 0);
      else result = result.filter(c => c.orderCount === 0);
    }

    if (clientsSort) {
      result.sort((a, b) => {
        const aVal = a[clientsSort.key];
        const bVal = b[clientsSort.key];
        const multiplier = clientsSort.direction === 'asc' ? 1 : -1;
        if (typeof aVal === 'number') return (aVal - bVal) * multiplier;
        return String(aVal || '').localeCompare(String(bVal || '')) * multiplier;
      });
    }

    return result;
  }, [clientsData, clientsFilters, clientsSort]);

  const filteredProducts = useMemo(() => {
    let result = [...productsData];
    
    const { search, brand } = productsFilters;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower)
      );
    }
    if (brand && brand.length > 0) {
      result = result.filter(p => brand.includes(p.brand));
    }

    if (productsSort) {
      result.sort((a, b) => {
        const aVal = a[productsSort.key];
        const bVal = b[productsSort.key];
        const multiplier = productsSort.direction === 'asc' ? 1 : -1;
        if (typeof aVal === 'number') return (aVal - bVal) * multiplier;
        return String(aVal || '').localeCompare(String(bVal || '')) * multiplier;
      });
    }

    return result;
  }, [productsData, productsFilters, productsSort]);

  const filteredCoupons = useMemo(() => {
    let result = [...couponsData];
    
    const { search, type } = couponsFilters;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(c => c.code?.toLowerCase().includes(searchLower));
    }
    if (type && type !== 'all') {
      result = result.filter(c => c.discountType === type);
    }

    return result;
  }, [couponsData, couponsFilters]);

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

  // Sort helper
  const toggleSort = (key: string, currentSort: SortConfig, setSort: (s: SortConfig) => void) => {
    if (currentSort?.key === key) {
      if (currentSort.direction === 'desc') setSort({ key, direction: 'asc' });
      else setSort(null);
    } else {
      setSort({ key, direction: 'desc' });
    }
  };

  const SortIcon = ({ sortKey, sort }: { sortKey: string; sort: SortConfig }) => {
    if (sort?.key !== sortKey) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sort.direction === 'desc' 
      ? <ArrowDown className="w-3 h-3 ml-1" /> 
      : <ArrowUp className="w-3 h-3 ml-1" />;
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'sales') loadSales();
    else if (value === 'clients') loadClients();
    else if (value === 'products') loadProducts();
    else if (value === 'coupons') loadCoupons();
  };

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
        <Tabs value={activeTab} onValueChange={handleTabChange}>
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

            <ReportFilters
              filters={salesFilterConfig}
              values={salesFilters}
              onChange={(key, value) => setSalesFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setSalesFilters({})}
              resultCount={filteredSales.length}
            />

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={salesExport.openModal} className="gap-2">
                <Settings2 className="w-4 h-4" />
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
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSort('total', salesSort, setSalesSort)}
                      >
                        <span className="flex items-center justify-end">
                          Total
                          <SortIcon sortKey="total" sort={salesSort} />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSort('created_at', salesSort, setSalesSort)}
                      >
                        <span className="flex items-center">
                          Data
                          <SortIcon sortKey="created_at" sort={salesSort} />
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.slice(0, 100).map(order => (
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

            <ReportFilters
              filters={clientsFilterConfig}
              values={clientsFilters}
              onChange={(key, value) => setClientsFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setClientsFilters({})}
              resultCount={filteredClients.length}
            />

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clientsExport.openModal} className="gap-2">
                <Settings2 className="w-4 h-4" />
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
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSort('orderCount', clientsSort, setClientsSort)}
                      >
                        <span className="flex items-center justify-end">
                          Pedidos
                          <SortIcon sortKey="orderCount" sort={clientsSort} />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSort('totalSpent', clientsSort, setClientsSort)}
                      >
                        <span className="flex items-center justify-end">
                          Total Gasto
                          <SortIcon sortKey="totalSpent" sort={clientsSort} />
                        </span>
                      </TableHead>
                      <TableHead>Último Pedido</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map(client => (
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

            <ReportFilters
              filters={productsFilterConfig}
              values={productsFilters}
              onChange={(key, value) => setProductsFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setProductsFilters({})}
              resultCount={filteredProducts.length}
            />

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={productsExport.openModal} className="gap-2">
                <Settings2 className="w-4 h-4" />
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
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSort('quantity', productsSort, setProductsSort)}
                      >
                        <span className="flex items-center justify-end">
                          Qtd
                          <SortIcon sortKey="quantity" sort={productsSort} />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSort('revenue', productsSort, setProductsSort)}
                      >
                        <span className="flex items-center justify-end">
                          Receita
                          <SortIcon sortKey="revenue" sort={productsSort} />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSort('profit', productsSort, setProductsSort)}
                      >
                        <span className="flex items-center justify-end">
                          Lucro
                          <SortIcon sortKey="profit" sort={productsSort} />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSort('margin', productsSort, setProductsSort)}
                      >
                        <span className="flex items-center justify-end">
                          Margem
                          <SortIcon sortKey="margin" sort={productsSort} />
                        </span>
                      </TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(product => (
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
                            product.margin >= 30 ? 'text-emerald-600' : product.margin >= 15 ? 'text-amber-600' : 'text-destructive'
                          }`}>
                            {product.margin.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={product.stock < 5 ? 'text-destructive font-medium' : ''}>
                            {product.stock}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
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

            <ReportFilters
              filters={couponsFilterConfig}
              values={couponsFilters}
              onChange={(key, value) => setCouponsFilters(prev => ({ ...prev, [key]: value }))}
              onClear={() => setCouponsFilters({})}
              resultCount={filteredCoupons.length}
            />

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={couponsExport.openModal} className="gap-2">
                <Settings2 className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredCoupons.length === 0 ? (
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
                    {filteredCoupons.map(use => (
                      <TableRow key={use.id}>
                        <TableCell className="font-mono font-medium">{use.code}</TableCell>
                        <TableCell>
                          {use.discountType === 'percentage' ? 'Percentual' : 'Valor fixo'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(Number(use.discount_applied))}
                        </TableCell>
                        <TableCell>
                          {use.currentUses} / {use.maxUses || '∞'}
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

      {/* Export Modals */}
      <ExportModal
        open={salesExport.open}
        onOpenChange={salesExport.setOpen}
        title="Exportar Vendas"
        description="Selecione as colunas que deseja incluir no relatório"
        columns={salesExportColumns}
        data={filteredSales}
        filename={`vendas-${startDate}-a-${endDate}`}
      />

      <ExportModal
        open={clientsExport.open}
        onOpenChange={clientsExport.setOpen}
        title="Exportar Clientes"
        description="Selecione as colunas que deseja incluir no relatório"
        columns={clientsExportColumns}
        data={filteredClients}
        filename={`clientes-${format(new Date(), 'yyyy-MM-dd')}`}
      />

      <ExportModal
        open={productsExport.open}
        onOpenChange={productsExport.setOpen}
        title="Exportar Produtos"
        description="Selecione as colunas que deseja incluir no relatório"
        columns={productsExportColumns}
        data={filteredProducts}
        filename={`produtos-${startDate}-a-${endDate}`}
      />

      <ExportModal
        open={couponsExport.open}
        onOpenChange={couponsExport.setOpen}
        title="Exportar Cupons"
        description="Selecione as colunas que deseja incluir no relatório"
        columns={couponsExportColumns}
        data={filteredCoupons}
        filename={`cupons-${startDate}-a-${endDate}`}
      />
    </AdminLayout>
  );
}
