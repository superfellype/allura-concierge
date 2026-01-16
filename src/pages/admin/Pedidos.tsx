import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Eye, Package, Truck, CheckCircle, X, MapPin, CreditCard, Filter, Calendar, ChevronDown, Users, Wallet } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { calculateNetAmount, formatCurrency } from "@/lib/price-utils";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
    images: string[] | null;
  } | null;
}

interface Order {
  id: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  status: OrderStatus;
  created_at: string;
  shipping_address: any;
  payment_method: string | null;
  payment_id: string | null;
  notes: string | null;
  origin: string | null;
  seller_id: string | null;
  discount_total: number | null;
  profiles: { full_name: string | null; phone: string | null } | null;
  seller?: { id: string; name: string } | null;
  items?: OrderItem[];
}

const statusFlow: OrderStatus[] = ["created", "pending_payment", "paid", "packing", "shipped", "delivered"];

const statusColors: Record<OrderStatus, string> = {
  created: "status-badge-neutral",
  pending_payment: "status-badge-warning",
  paid: "status-badge-success",
  packing: "status-badge-info",
  shipped: "status-badge-info",
  delivered: "status-badge-success",
  cancelled: "status-badge-danger",
};

const statusLabels: Record<OrderStatus, string> = {
  created: "Criado",
  pending_payment: "Aguardando Pagamento",
  paid: "Pago",
  packing: "Embalando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const ITEMS_PER_PAGE = 10;

const Pedidos = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos");
      setLoading(false);
      return;
    }

    // Fetch all unique seller_ids
    const sellerIds = [...new Set((data || []).map(o => o.seller_id).filter(Boolean))] as string[];
    
    // Fetch sellers in one query
    const { data: sellers } = sellerIds.length > 0 
      ? await supabase.from("sellers").select("id, name").in("id", sellerIds)
      : { data: [] };
    
    const sellerMap = new Map<string, { id: string; name: string }>(
      (sellers || []).map(s => [s.id, s] as [string, { id: string; name: string }])
    );

    // Fetch profiles for each order
    const ordersWithProfiles = await Promise.all(
      (data || []).map(async (order) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", order.user_id)
          .maybeSingle();
        return { 
          ...order, 
          profiles: profile,
          seller: order.seller_id ? sellerMap.get(order.seller_id) : null
        };
      })
    );

    setOrders(ordersWithProfiles as Order[]);
    setLoading(false);
  };

  const fetchOrderItems = async (orderId: string) => {
    const { data } = await supabase
      .from("order_items")
      .select("id, quantity, unit_price, total_price, product_id")
      .eq("order_id", orderId);

    if (data) {
      const itemsWithProducts = await Promise.all(
        data.map(async (item) => {
          const { data: product } = await supabase
            .from("products")
            .select("name, images")
            .eq("id", item.product_id)
            .maybeSingle();
          return { ...item, product };
        })
      );
      return itemsWithProducts;
    }
    return [];
  };

  const openOrderDetail = async (order: Order) => {
    const items = await fetchOrderItems(order.id);
    setSelectedOrder({ ...order, items });
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success("Status atualizado!");
    fetchOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelConfirm.id) return;
    await updateStatus(cancelConfirm.id, "cancelled");
    setCancelConfirm({ open: false, id: null });
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) return null;
    return statusFlow[currentIndex + 1];
  };

  const getDateFilterRange = (): { start: Date | null; end: Date | null } => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return { start: today, end: null };
      case "week":
        return { start: new Date(now.setDate(now.getDate() - 7)), end: null };
      case "month":
        return { start: new Date(now.setMonth(now.getMonth() - 1)), end: null };
      case "quarter":
        return { start: new Date(now.setMonth(now.getMonth() - 3)), end: null };
      case "custom":
        return { 
          start: customDateRange?.from || null, 
          end: customDateRange?.to || null 
        };
      default:
        return { start: null, end: null };
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesOrigin = originFilter === "all" || order.origin === originFilter;
    
    const { start, end } = getDateFilterRange();
    const orderDate = new Date(order.created_at);
    let matchesDate = true;
    
    if (start) {
      matchesDate = orderDate >= start;
    }
    if (end && matchesDate) {
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      matchesDate = orderDate <= endOfDay;
    }
    
    return matchesSearch && matchesStatus && matchesOrigin && matchesDate;
  });

  const activeFiltersCount = [
    statusFilter !== "all",
    originFilter !== "all", 
    dateFilter !== "all" || customDateRange?.from
  ].filter(Boolean).length;

  const getDateFilterLabel = () => {
    if (dateFilter === "custom" && customDateRange?.from) {
      if (customDateRange.to) {
        return `${format(customDateRange.from, "dd/MM", { locale: ptBR })} - ${format(customDateRange.to, "dd/MM", { locale: ptBR })}`;
      }
      return format(customDateRange.from, "dd/MM/yyyy", { locale: ptBR });
    }
    switch (dateFilter) {
      case "today": return "Hoje";
      case "week": return "7 dias";
      case "month": return "30 dias";
      case "quarter": return "3 meses";
      default: return "";
    }
  };

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AdminLayout title="Pedidos">
      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por ID ou cliente..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-11"
            />
          </div>

          {/* Quick Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusFlow.map((status) => (
                <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
              ))}
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Popover */}
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 relative">
                <Filter className="w-4 h-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filtros Avançados</h4>
                
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Origem</label>
                  <Select value={originFilter} onValueChange={setOriginFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="site">Site</SelectItem>
                      <SelectItem value="manual">Venda Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Período</label>
                  <Select value={dateFilter} onValueChange={(v) => {
                    setDateFilter(v);
                    if (v !== "custom") {
                      setCustomDateRange(undefined);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Últimos 7 dias</SelectItem>
                      <SelectItem value="month">Últimos 30 dias</SelectItem>
                      <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dateFilter === "custom" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Selecionar datas</label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {customDateRange?.from ? (
                            customDateRange.to ? (
                              <>
                                {format(customDateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                                {format(customDateRange.to, "dd/MM/yy", { locale: ptBR })}
                              </>
                            ) : (
                              format(customDateRange.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                          ) : (
                            "Selecionar período"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="range"
                          selected={customDateRange}
                          onSelect={(range) => {
                            setCustomDateRange(range);
                            if (range?.to) {
                              setDatePickerOpen(false);
                            }
                          }}
                          numberOfMonths={2}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setStatusFilter("all");
                      setOriginFilter("all");
                      setDateFilter("all");
                      setCustomDateRange(undefined);
                    }}
                  >
                    Limpar
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setFiltersOpen(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusLabels[statusFilter as OrderStatus] || statusFilter}
                <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {originFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Origem: {originFilter === "site" ? "Site" : "Manual"}
                <button onClick={() => setOriginFilter("all")} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {(dateFilter !== "all" || customDateRange?.from) && (
              <Badge variant="secondary" className="gap-1">
                Período: {getDateFilterLabel()}
                <button onClick={() => { setDateFilter("all"); setCustomDateRange(undefined); }} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {filteredOrders.length} pedido(s) encontrado(s)
        </p>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-muted-foreground mt-2">Carregando...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-body text-muted-foreground">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="liquid-glass-card p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-body font-semibold">#{order.id.slice(0, 8)}</h3>
                      <span className={`status-badge ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="font-body text-sm text-muted-foreground">
                      {order.profiles?.full_name || "Cliente"} • {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      {order.seller && (
                        <span className="ml-1 text-primary">
                          • Vendedor: {order.seller.name}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="glass-kpi glass-kpi-md">
                      R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => openOrderDetail(order)}
                      className="glass-button p-2.5 rounded-xl"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <div className="mt-4 pt-4 border-t border-border/20 flex flex-wrap gap-2">
                    {getNextStatus(order.status) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateStatus(order.id, getNextStatus(order.status)!)}
                        className="glass-btn text-sm flex items-center gap-2"
                      >
                        {order.status === "paid" && <Package className="w-4 h-4" />}
                        {order.status === "packing" && <Truck className="w-4 h-4" />}
                        {order.status === "shipped" && <CheckCircle className="w-4 h-4" />}
                        Avançar para {statusLabels[getNextStatus(order.status)!]}
                      </motion.button>
                    )}
                    <button
                      onClick={() => setCancelConfirm({ open: true, id: order.id })}
                      className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl text-sm font-body transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Order Detail Modal - Liquid Glass */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 modal-overlay"
            onClick={() => setSelectedOrder(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-2xl liquid-glass-card p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-medium">
                  Pedido #{selectedOrder.id.slice(0, 8)}
                </h2>
                <p className="font-body text-sm text-muted-foreground">
                  {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="glass-button p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="font-body text-sm text-muted-foreground">Status:</span>
                <span className={`status-badge ${statusColors[selectedOrder.status]}`}>
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>

              {/* Customer Info */}
              <div className="liquid-glass-card p-4">
                <h3 className="font-body font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Cliente
                </h3>
                <p className="font-body text-sm">{selectedOrder.profiles?.full_name || "Cliente"}</p>
                {selectedOrder.profiles?.phone && (
                  <p className="font-body text-sm text-muted-foreground">{selectedOrder.profiles.phone}</p>
                )}
              </div>

              {/* Seller Info */}
              {selectedOrder.seller && (
                <div className="liquid-glass-card p-4">
                  <h3 className="font-body font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Vendedor
                  </h3>
                  <p className="font-body text-sm">{selectedOrder.seller.name}</p>
                </div>
              )}

              {/* Shipping Address */}
              <div className="liquid-glass-card p-4">
                <h3 className="font-body font-medium mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Endereço de Entrega
                </h3>
                <p className="font-body text-sm">
                  {selectedOrder.shipping_address?.street}, {selectedOrder.shipping_address?.number}
                  {selectedOrder.shipping_address?.complement && ` - ${selectedOrder.shipping_address.complement}`}
                </p>
                <p className="font-body text-sm">
                  {selectedOrder.shipping_address?.neighborhood}
                </p>
                <p className="font-body text-sm">
                  {selectedOrder.shipping_address?.city} - {selectedOrder.shipping_address?.state}
                </p>
                <p className="font-body text-sm">CEP: {selectedOrder.shipping_address?.zip}</p>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="font-body font-medium mb-3">Itens do Pedido</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                        <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden">
                          {item.product?.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-body text-sm font-medium">{item.product?.name || "Produto"}</p>
                          <p className="font-body text-xs text-muted-foreground">
                            {item.quantity}x R$ {Number(item.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <span className="font-body font-medium">
                          R$ {Number(item.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div className="liquid-glass-card p-4">
                <h3 className="font-body font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Pagamento
                </h3>
                <div className="space-y-1">
                  <p className="font-body text-sm">
                    Método: {selectedOrder.payment_method || "Não informado"}
                  </p>
                  {selectedOrder.payment_id && (
                    <p className="font-body text-xs text-muted-foreground">
                      ID: {selectedOrder.payment_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-border/20 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-body text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-body">R$ {Number(selectedOrder.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-body text-sm text-muted-foreground">Frete</span>
                  <span className="font-body">R$ {Number(selectedOrder.shipping_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {selectedOrder.discount_total && Number(selectedOrder.discount_total) > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="font-body text-sm text-green-600">Desconto</span>
                    <span className="font-body text-green-600">- R$ {Number(selectedOrder.discount_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {/* Taxa e valor líquido - extrair taxa real das notas */}
                {(() => {
                  // Extrair taxa das notas do pedido
                  const extractTaxFromNotes = (notes: string | null): number | null => {
                    if (!notes) return null;
                    const match = notes.match(/Taxa:\s*([\d.,]+)%/);
                    if (match) {
                      return parseFloat(match[1].replace(',', '.'));
                    }
                    return null;
                  };
                  
                  // Filtrar a taxa das notas para não duplicar
                  const filterTaxFromNotes = (notes: string | null): string | null => {
                    if (!notes) return null;
                    return notes.replace(/\n?Taxa:\s*[\d.,]+%\n?/g, '').trim() || null;
                  };

                  const taxRate = extractTaxFromNotes(selectedOrder.notes);
                  const filteredNotes = filterTaxFromNotes(selectedOrder.notes);
                  
                  if (taxRate === null || taxRate === 0) {
                    // Sem taxa - apenas mostrar total
                    return (
                      <>
                        <div className="flex justify-between pt-2 border-t border-border/20">
                          <span className="font-body font-medium">Total</span>
                          <span className="glass-kpi glass-kpi-md">
                            R$ {Number(selectedOrder.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {filteredNotes && (
                          <div className="liquid-glass-card p-4 border-l-4 border-l-amber-400 mt-4">
                            <h3 className="font-body font-medium mb-2">Observações</h3>
                            <p className="font-body text-sm text-muted-foreground">{filteredNotes}</p>
                          </div>
                        )}
                      </>
                    );
                  }
                  
                  // Com taxa - mostrar breakdown completo
                  const { tax, net } = calculateNetAmount(Number(selectedOrder.total), taxRate);
                  return (
                    <>
                      <div className="flex justify-between pt-2 border-t border-border/20">
                        <span className="font-body font-medium">Total cobrado</span>
                        <span className="glass-kpi glass-kpi-md">
                          R$ {Number(selectedOrder.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="font-body text-sm text-muted-foreground flex items-center gap-1">
                          Taxa maquininha
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{taxRate}%</span>
                        </span>
                        <span className="font-body text-destructive">- {formatCurrency(tax)}</span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="font-body text-sm flex items-center gap-1">
                          <Wallet className="w-3 h-3" /> Você recebe
                        </span>
                        <span className="font-body font-semibold text-emerald-600">{formatCurrency(net)}</span>
                      </div>
                      {filteredNotes && (
                        <div className="liquid-glass-card p-4 border-l-4 border-l-amber-400 mt-4">
                          <h3 className="font-body font-medium mb-2">Observações</h3>
                          <p className="font-body text-sm text-muted-foreground">{filteredNotes}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full glass-btn"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        open={cancelConfirm.open}
        onOpenChange={(open) => setCancelConfirm({ open, id: open ? cancelConfirm.id : null })}
        title="Cancelar Pedido"
        description="Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita."
        confirmText="Cancelar Pedido"
        onConfirm={handleCancelOrder}
        variant="destructive"
      />
    </AdminLayout>
  );
};

export default Pedidos;
