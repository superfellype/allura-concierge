import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, User, Clock, GripVertical, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  payment_method: string | null;
  profiles: { full_name: string | null } | null;
}

const statusConfig: { status: OrderStatus; label: string; color: string; bgColor: string }[] = [
  { status: "created", label: "Novos", color: "text-slate-700", bgColor: "bg-slate-100" },
  { status: "pending_payment", label: "Aguardando", color: "text-amber-700", bgColor: "bg-amber-50" },
  { status: "paid", label: "Pagos", color: "text-green-700", bgColor: "bg-green-50" },
  { status: "packing", label: "Embalando", color: "text-blue-700", bgColor: "bg-blue-50" },
  { status: "shipped", label: "Enviados", color: "text-purple-700", bgColor: "bg-purple-50" },
  { status: "delivered", label: "Entregues", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  { status: "cancelled", label: "Cancelados", color: "text-red-700", bgColor: "bg-red-50" },
];

const PedidosKanban = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    orderId: string | null;
    newStatus: OrderStatus | null;
  }>({ open: false, orderId: null, newStatus: null });

  useEffect(() => {
    fetchOrders();

    // Realtime subscription
    const channel = supabase
      .channel("orders-kanban")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, total, status, created_at, payment_method, user_id")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar pedidos");
      return;
    }

    // Fetch profiles for each order
    const ordersWithProfiles = await Promise.all(
      (data || []).map(async (order) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", order.user_id)
          .maybeSingle();
        return { ...order, profiles: profile } as Order;
      })
    );

    setOrders(ordersWithProfiles);
    setLoading(false);
  };

  const handleDragStart = (e: React.DragEvent, order: Order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: OrderStatus) => {
    e.preventDefault();
    if (!draggedOrder || draggedOrder.status === newStatus) {
      setDraggedOrder(null);
      return;
    }

    // Show confirmation for destructive actions
    if (newStatus === "cancelled") {
      setConfirmDialog({
        open: true,
        orderId: draggedOrder.id,
        newStatus,
      });
    } else {
      updateOrderStatus(draggedOrder.id, newStatus);
    }
    setDraggedOrder(null);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success(`Pedido movido para ${statusConfig.find((s) => s.status === newStatus)?.label}`);
    fetchOrders();
  };

  const handleConfirmStatusChange = () => {
    if (confirmDialog.orderId && confirmDialog.newStatus) {
      updateOrderStatus(confirmDialog.orderId, confirmDialog.newStatus);
    }
    setConfirmDialog({ open: false, orderId: null, newStatus: null });
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOrdersByStatus = (status: OrderStatus) =>
    filteredOrders.filter((order) => order.status === status);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <AdminLayout title="Kanban de Pedidos">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por ID ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-muted-foreground mt-2">Carregando...</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {statusConfig.map((column) => {
              const columnOrders = getOrdersByStatus(column.status);
              return (
                <div
                  key={column.status}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.status)}
                  className="w-72 flex-shrink-0"
                >
                  {/* Column Header */}
                  <div className={`rounded-t-xl px-4 py-3 ${column.bgColor}`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-body font-medium ${column.color}`}>
                        {column.label}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${column.bgColor} ${column.color}`}
                      >
                        {columnOrders.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Body */}
                  <div className="bg-secondary/20 rounded-b-xl p-2 min-h-[60vh] space-y-2">
                    {columnOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Package className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Nenhum pedido</p>
                      </div>
                    ) : (
                      columnOrders.map((order) => (
                        <motion.div
                          key={order.id}
                          layout
                          draggable
                          onDragStart={(e) => handleDragStart(e as any, order)}
                          className="liquid-glass p-3 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-body text-xs font-medium text-primary">
                              #{order.id.slice(0, 8)}
                            </span>
                            <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="font-body text-sm truncate">
                              {order.profiles?.full_name || "Cliente"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="font-display text-sm font-semibold">
                              R$ {Number(order.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{formatDate(order.created_at)}</span>
                            </div>
                          </div>

                          {order.payment_method && (
                            <div className="mt-2 pt-2 border-t border-border/30">
                              <span className="text-xs text-muted-foreground">
                                {order.payment_method}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Dialog for Cancel */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open, orderId: open ? confirmDialog.orderId : null })
        }
        title="Cancelar Pedido"
        description="Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita."
        confirmText="Cancelar Pedido"
        onConfirm={handleConfirmStatusChange}
        variant="destructive"
      />
    </AdminLayout>
  );
};

export default PedidosKanban;
