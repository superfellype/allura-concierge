import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Eye, Package, Truck, CheckCircle, X, MapPin, CreditCard, Calendar } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

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
  profiles: { full_name: string | null; phone: string | null } | null;
  items?: OrderItem[];
}

const statusFlow: OrderStatus[] = ["created", "pending_payment", "paid", "packing", "shipped", "delivered"];

const statusColors: Record<OrderStatus, string> = {
  created: "bg-muted text-muted-foreground",
  pending_payment: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  packing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelConfirm, setCancelConfirm] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos");
      return;
    }

    const ordersWithProfiles = await Promise.all(
      (data || []).map(async (order) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", order.user_id)
          .maybeSingle();
        return { ...order, profiles: profile };
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AdminLayout title="Pedidos">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por ID ou cliente..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Todos os status</option>
          {statusFlow.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-muted-foreground mt-2">Carregando...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="liquid-card text-center py-12">
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
                className="liquid-card"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-body font-semibold">#{order.id.slice(0, 8)}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="font-body text-sm text-muted-foreground">
                      {order.profiles?.full_name || "Cliente"} • {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-display text-xl font-semibold">
                      R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => openOrderDetail(order)}
                      className="p-2 glass-button rounded-xl"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap gap-2">
                    {getNextStatus(order.status) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateStatus(order.id, getNextStatus(order.status)!)}
                        className="px-4 py-2 liquid-button text-sm text-primary-foreground font-body flex items-center gap-2"
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-2xl liquid-card-strong p-6 max-h-[90vh] overflow-y-auto"
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
                className="p-2 hover:bg-secondary rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="font-body text-sm text-muted-foreground">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>

              {/* Customer Info */}
              <div className="p-4 rounded-xl bg-secondary/30">
                <h3 className="font-body font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Cliente
                </h3>
                <p className="font-body text-sm">{selectedOrder.profiles?.full_name || "Cliente"}</p>
                {selectedOrder.profiles?.phone && (
                  <p className="font-body text-sm text-muted-foreground">{selectedOrder.profiles.phone}</p>
                )}
              </div>

              {/* Shipping Address */}
              <div className="p-4 rounded-xl bg-secondary/30">
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
              <div className="p-4 rounded-xl bg-secondary/30">
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
              <div className="border-t border-border pt-4">
                <div className="flex justify-between mb-2">
                  <span className="font-body text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-body">R$ {Number(selectedOrder.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-body text-sm text-muted-foreground">Frete</span>
                  <span className="font-body">R$ {Number(selectedOrder.shipping_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-body font-medium">Total</span>
                  <span className="font-display text-xl font-semibold">
                    R$ {Number(selectedOrder.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <h3 className="font-body font-medium mb-2">Observações</h3>
                  <p className="font-body text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && getNextStatus(selectedOrder.status) && (
                <button
                  onClick={() => updateStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                  className="flex-1 py-3 liquid-button rounded-xl text-primary-foreground font-body font-medium"
                >
                  Avançar para {statusLabels[getNextStatus(selectedOrder.status)!]}
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-3 glass-button rounded-xl font-body font-medium"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Confirmation */}
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
