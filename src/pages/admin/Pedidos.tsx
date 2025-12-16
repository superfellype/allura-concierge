import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Eye, Package, Truck, CheckCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  shipping_address: any;
  profiles: { full_name: string | null } | null;
}

const statusFlow: OrderStatus[] = ["created", "pending_payment", "paid", "packing", "shipped", "delivered"];

const statusColors: Record<OrderStatus, string> = {
  created: "bg-gray-100 text-gray-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
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

const Pedidos = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, total, status, created_at, shipping_address, user_id")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos");
      return;
    }

    // Fetch profiles separately
    const ordersWithProfiles = await Promise.all(
      (data || []).map(async (order) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", order.user_id)
          .single();
        return { ...order, profiles: profile };
      })
    );

    setOrders(ordersWithProfiles as Order[]);
    setLoading(false);
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
    setSelectedOrder(null);
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
          <p className="font-body text-muted-foreground">Carregando...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="liquid-card text-center py-12">
          <p className="font-body text-muted-foreground">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
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
                    R$ {order.total.toLocaleString('pt-BR')}
                  </span>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 glass-button rounded-xl"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Status Actions */}
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
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl text-sm font-body transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
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
            className="relative z-10 w-full max-w-lg liquid-card p-6"
          >
            <h2 className="font-display text-2xl font-medium mb-6">
              Pedido #{selectedOrder.id.slice(0, 8)}
            </h2>

            <div className="space-y-4">
              <div>
                <p className="font-body text-sm text-muted-foreground">Cliente</p>
                <p className="font-body font-medium">{selectedOrder.profiles?.full_name || "Cliente"}</p>
              </div>

              <div>
                <p className="font-body text-sm text-muted-foreground">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                  {statusLabels[selectedOrder.status]}
                </span>
              </div>

              <div>
                <p className="font-body text-sm text-muted-foreground">Total</p>
                <p className="font-display text-2xl font-semibold">
                  R$ {selectedOrder.total.toLocaleString('pt-BR')}
                </p>
              </div>

              <div>
                <p className="font-body text-sm text-muted-foreground">Endereço de Entrega</p>
                <p className="font-body text-sm">
                  {selectedOrder.shipping_address?.street}, {selectedOrder.shipping_address?.number}
                  <br />
                  {selectedOrder.shipping_address?.city} - {selectedOrder.shipping_address?.state}
                  <br />
                  CEP: {selectedOrder.shipping_address?.zip}
                </p>
              </div>

              <div>
                <p className="font-body text-sm text-muted-foreground">Data do Pedido</p>
                <p className="font-body">
                  {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full py-3 glass-button rounded-xl font-body font-medium"
            >
              Fechar
            </button>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Pedidos;
