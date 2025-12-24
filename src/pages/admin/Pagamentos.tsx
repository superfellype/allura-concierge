import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Search, 
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
  Loader2
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminPagination from "@/components/admin/AdminPagination";
import { Link } from "react-router-dom";

interface Payment {
  id: string;
  order_id: string;
  provider: string;
  provider_reference: string | null;
  status: string;
  amount: number;
  method: string | null;
  created_at: string;
  orders?: {
    id: string;
    status: string;
    total: number;
    user_id: string;
    profiles?: {
      full_name: string | null;
    };
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
  processing: { label: "Processando", color: "bg-blue-500/10 text-blue-700 border-blue-500/30", icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
  paid: { label: "Pago", color: "bg-green-500/10 text-green-700 border-green-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { label: "Falhou", color: "bg-red-500/10 text-red-700 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelado", color: "bg-gray-500/10 text-gray-700 border-gray-500/30", icon: <XCircle className="w-3 h-3" /> },
  refunded: { label: "Reembolsado", color: "bg-purple-500/10 text-purple-700 border-purple-500/30", icon: <RefreshCw className="w-3 h-3" /> },
};

const ITEMS_PER_PAGE = 20;

const Pagamentos = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          orders (
            id,
            status,
            total,
            user_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Erro ao carregar pagamentos");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.id.toLowerCase().includes(search.toLowerCase()) ||
      payment.order_id.toLowerCase().includes(search.toLowerCase()) ||
      (payment.provider_reference?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesProvider = providerFilter === "all" || payment.provider === providerFilter;
    
    return matchesSearch && matchesStatus && matchesProvider;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
  };

  // Unique providers
  const providers = [...new Set(payments.map(p => p.provider))];

  return (
    <AdminLayout title="Pagamentos">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif flex items-center gap-3">
              <div className="glass-icon w-10 h-10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              Pagamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os pagamentos dos pedidos
            </p>
          </div>
          
          <Button
            onClick={fetchPayments}
            variant="outline"
            className="glass-btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="liquid-glass-card p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold glass-kpi">{stats.total}</p>
          </div>
          <div className="liquid-glass-card p-4">
            <p className="text-sm text-muted-foreground">Pagos</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </div>
          <div className="liquid-glass-card p-4">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="liquid-glass-card p-4">
            <p className="text-sm text-muted-foreground">Falharam</p>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </div>
          <div className="liquid-glass-card p-4 col-span-2 md:col-span-1">
            <p className="text-sm text-muted-foreground">Valor Total Pago</p>
            <p className="text-xl font-bold text-primary">{formatPrice(stats.totalAmount)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="liquid-glass-card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou referência..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] glass-input">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[160px] glass-input">
                <CreditCard className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {providers.map(provider => (
                  <SelectItem key={provider} value={provider}>
                    {provider === 'stripe' ? 'Stripe' : 
                     provider === 'infinitepay' ? 'InfinitePay' : 
                     provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="liquid-glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">Carregando pagamentos...</p>
            </div>
          ) : paginatedPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>ID</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.map((payment) => {
                  const config = statusConfig[payment.status] || statusConfig.pending;
                  
                  return (
                    <TableRow key={payment.id} className="border-border/30">
                      <TableCell className="font-mono text-xs">
                        {payment.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/admin/pedidos?id=${payment.order_id}`}
                          className="text-primary hover:underline font-mono text-xs"
                        >
                          {payment.order_id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.provider === 'stripe' ? '💳 Stripe' : 
                           payment.provider === 'infinitepay' ? '💰 InfinitePay' : 
                           payment.provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.method || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(Number(payment.amount))}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(payment.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {payment.provider_reference && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(payment.provider_reference || '');
                                toast.success('Referência copiada!');
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                          <Link to={`/admin/pedidos?id=${payment.order_id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default Pagamentos;
