import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, User, ShoppingBag, TrendingUp, Eye, Trash2, X, ArrowUpDown, Download } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { ExportModal, ExportColumn } from "@/components/admin/ExportModal";
import { exportToCSV, formatDateForExport } from "@/lib/export-utils";
import { format } from "date-fns";

interface CustomerOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

interface Customer {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  ordersCount: number;
  totalSpent: number;
  orders?: CustomerOrder[];
}

const ITEMS_PER_PAGE = 15;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Clientes = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [orderFilter, setOrderFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Export
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar clientes");
      return;
    }

    const customersWithOrders = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, total, status, created_at")
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false });

        return {
          ...profile,
          ordersCount: orders?.length || 0,
          totalSpent: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
          orders: orders || [],
        };
      })
    );

    setCustomers(customersWithOrders);
    setLoading(false);
  };

  const handleDeleteClick = (customer: Customer) => {
    if (customer.ordersCount > 0) {
      toast.error("Não é possível excluir clientes com pedidos");
      return;
    }
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    setDeleting(true);
    
    // Delete profile first
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", customerToDelete.id);
    
    if (profileError) {
      toast.error("Erro ao excluir cliente");
      setDeleting(false);
      return;
    }
    
    toast.success("Cliente excluído com sucesso");
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
    setDeleting(false);
    fetchCustomers();
  };

  const filteredCustomers = customers
    .filter((c) => {
      const matchesSearch = c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery);
      
      const matchesOrder = orderFilter === "all" ||
        (orderFilter === "with_orders" && c.ordersCount > 0) ||
        (orderFilter === "without_orders" && c.ordersCount === 0);
      
      return matchesSearch && matchesOrder;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.full_name || "").localeCompare(b.full_name || "");
        case "orders":
          return b.ordersCount - a.ordersCount;
        case "spent":
          return b.totalSpent - a.totalSpent;
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const activeFiltersCount = [
    orderFilter !== "all",
    sortBy !== "recent"
  ].filter(Boolean).length;

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalCustomers = customers.length;
  const customersWithOrders = customers.filter(c => c.ordersCount > 0).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageTicket = customersWithOrders > 0 ? totalRevenue / customersWithOrders : 0;

  const exportColumns: ExportColumn[] = [
    { key: "full_name", label: "Nome", defaultEnabled: true, format: (v) => v || "Sem nome" },
    { key: "phone", label: "Telefone", defaultEnabled: true, format: (v) => v || "-" },
    { key: "ordersCount", label: "Qtd Pedidos", defaultEnabled: true },
    { key: "totalSpent", label: "Total Gasto", defaultEnabled: true, format: (v) => `R$ ${Number(v).toFixed(2)}` },
    { key: "created_at", label: "Data Cadastro", defaultEnabled: true, format: (v) => formatDateForExport(v) },
  ];

  return (
    <AdminLayout title="Clientes">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">{totalCustomers}</p>
                <p className="font-body text-sm text-muted-foreground">Total de Clientes</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">{customersWithOrders}</p>
                <p className="font-body text-sm text-muted-foreground">Com Pedidos</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">
                  R$ {averageTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
                <p className="font-body text-sm text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-11"
              />
            </div>

            {/* Quick Order Filter */}
            <Select value={orderFilter} onValueChange={(v) => { setOrderFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Pedidos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_orders">Com pedidos</SelectItem>
                <SelectItem value="without_orders">Sem pedidos</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters */}
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                  <ArrowUpDown className="w-4 h-4" />
                  Ordenar
                  {sortBy !== "recent" && (
                    <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      1
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Ordenar por</h4>
                  
                  <div className="space-y-2">
                    {[
                      { id: "recent", label: "Mais recentes" },
                      { id: "name", label: "Nome (A-Z)" },
                      { id: "orders", label: "Mais pedidos" },
                      { id: "spent", label: "Maior gasto" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => { setSortBy(option.id); setFiltersOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          sortBy === option.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Export Button */}
            <Button variant="outline" onClick={() => setExportModalOpen(true)} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>

          {/* Active Filters Tags */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {orderFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {orderFilter === "with_orders" ? "Com pedidos" : "Sem pedidos"}
                  <button onClick={() => setOrderFilter("all")} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {sortBy !== "recent" && (
                <Badge variant="secondary" className="gap-1">
                  Ordenado: {sortBy === "name" ? "Nome" : sortBy === "orders" ? "Pedidos" : "Gasto"}
                  <button onClick={() => setSortBy("recent")} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {filteredCustomers.length} cliente(s) encontrado(s)
          </p>
        </motion.div>

        {/* Customers List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-body text-muted-foreground mt-2">Carregando...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-body text-muted-foreground">Nenhum cliente encontrado</p>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Cliente
                      </th>
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Telefone
                      </th>
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Pedidos
                      </th>
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Total Gasto
                      </th>
                      <th className="text-left py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Cadastro
                      </th>
                      <th className="text-right py-4 px-6 font-body text-sm font-medium text-muted-foreground">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border/20 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                              {customer.avatar_url ? (
                                <img
                                  src={customer.avatar_url}
                                  alt={customer.full_name || ""}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                <User className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <span className="font-body font-medium">{customer.full_name || "Sem nome"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-body text-sm text-muted-foreground">
                          {customer.phone || "—"}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                            customer.ordersCount > 0 
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {customer.ordersCount} pedido(s)
                          </span>
                        </td>
                        <td className="py-4 px-6 font-display text-sm font-semibold">
                          R$ {customer.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 font-body text-sm text-muted-foreground">
                          {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/clientes/${customer.id}`)}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(customer)}
                              disabled={customer.ordersCount > 0}
                              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title={customer.ordersCount > 0 ? "Clientes com pedidos não podem ser excluídos" : "Excluir cliente"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir o cliente "${customerToDelete?.full_name || 'Sem nome'}"? Esta ação não pode ser desfeita.`}
        confirmText={deleting ? "Excluindo..." : "Excluir"}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        columns={exportColumns}
        data={filteredCustomers}
        filename={`clientes-${format(new Date(), 'yyyy-MM-dd')}`}
        title="Exportar Clientes"
      />
    </AdminLayout>
  );
};

export default Clientes;