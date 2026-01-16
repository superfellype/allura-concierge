import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Cake, Gift, Users, TrendingUp, Download, Mail, 
  MessageSquare, Calendar, Star, Clock, ShoppingBag,
  UserCheck, UserX, ArrowRight, Sparkles
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToCSV, formatDateForExport } from "@/lib/export-utils";
import { formatCurrency } from "@/lib/price-utils";
import { ExportModal, ExportColumn } from "@/components/admin/ExportModal";

interface CustomerWithStats {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  preferences?: Record<string, unknown> | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
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

const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

export default function Marketing() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<string>("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar clientes");
      setLoading(false);
      return;
    }

    const customersWithStats: CustomerWithStats[] = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, total, created_at")
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false });

        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          phone: profile.phone,
          created_at: profile.created_at,
          ordersCount: orders?.length || 0,
          totalSpent: orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
          lastOrderDate: orders?.[0]?.created_at || null,
          preferences: profile.preferences as Record<string, unknown> | null,
        };
      })
    );

    setCustomers(customersWithStats);
    setLoading(false);
  };

  // Birthday customers for selected month
  const birthdayCustomers = useMemo(() => {
    return customers.filter(c => {
      const prefs = c.preferences as Record<string, unknown> | null;
      const birthdate = prefs?.birthdate;
      if (typeof birthdate !== 'string') return false;
      
      try {
        const date = parseISO(birthdate);
        return (date.getMonth() + 1) === parseInt(selectedMonth);
      } catch {
        return false;
      }
    });
  }, [customers, selectedMonth]);

  // Inactive customers (no orders in 60+ days)
  const inactiveCustomers = useMemo(() => {
    const now = new Date();
    return customers.filter(c => {
      if (!c.lastOrderDate) return c.ordersCount > 0; // Had orders but none recently
      const daysSinceLastOrder = differenceInDays(now, parseISO(c.lastOrderDate));
      return daysSinceLastOrder > 60;
    });
  }, [customers]);

  // VIP customers (top 10% by spending)
  const vipCustomers = useMemo(() => {
    const sorted = [...customers].filter(c => c.ordersCount > 0).sort((a, b) => b.totalSpent - a.totalSpent);
    const top10Percent = Math.max(1, Math.ceil(sorted.length * 0.1));
    return sorted.slice(0, top10Percent);
  }, [customers]);

  // New customers this month
  const newCustomers = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    return customers.filter(c => {
      const createdAt = parseISO(c.created_at);
      return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
    });
  }, [customers]);

  // Customers without orders
  const noOrderCustomers = useMemo(() => {
    return customers.filter(c => c.ordersCount === 0);
  }, [customers]);

  // Recurrent customers (3+ orders)
  const recurrentCustomers = useMemo(() => {
    return customers.filter(c => c.ordersCount >= 3);
  }, [customers]);

  const stats = {
    totalCustomers: customers.length,
    birthdaysThisMonth: birthdayCustomers.length,
    inactiveCount: inactiveCustomers.length,
    vipCount: vipCustomers.length,
    newThisMonth: newCustomers.length,
    noOrders: noOrderCustomers.length,
    recurrent: recurrentCustomers.length,
  };

  const exportColumns: ExportColumn[] = [
    { key: "full_name", label: "Nome", defaultEnabled: true, format: (v) => v || "Sem nome" },
    { key: "phone", label: "Telefone", defaultEnabled: true, format: (v) => v || "-" },
    { key: "ordersCount", label: "Qtd Pedidos", defaultEnabled: true },
    { key: "totalSpent", label: "Total Gasto", defaultEnabled: true, format: (v) => `R$ ${Number(v).toFixed(2)}` },
    { key: "lastOrderDate", label: "Último Pedido", defaultEnabled: true, format: (v) => v ? formatDateForExport(v) : "Nunca" },
    { key: "created_at", label: "Data Cadastro", defaultEnabled: false, format: (v) => formatDateForExport(v) },
  ];

  const handleExportClick = (type: string) => {
    setExportType(type);
    setExportModalOpen(true);
  };

  const getExportData = () => {
    switch (exportType) {
      case "birthdays": return birthdayCustomers;
      case "inactive": return inactiveCustomers;
      case "vip": return vipCustomers;
      case "new": return newCustomers;
      case "no_orders": return noOrderCustomers;
      case "recurrent": return recurrentCustomers;
      default: return [];
    }
  };

  const getExportFilename = () => {
    const typeLabels: Record<string, string> = {
      birthdays: "aniversariantes",
      inactive: "inativos",
      vip: "vip",
      new: "novos",
      no_orders: "sem-pedidos",
      recurrent: "recorrentes",
    };
    return `clientes-${typeLabels[exportType] || "lista"}-${format(new Date(), 'yyyy-MM-dd')}`;
  };

  const CustomerTable = ({ data, emptyMessage }: { data: CustomerWithStats[]; emptyMessage: string }) => (
    <div className="rounded-lg border overflow-hidden">
      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Pedidos</TableHead>
              <TableHead>Total Gasto</TableHead>
              <TableHead>Último Pedido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map(customer => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.full_name || "Sem nome"}</TableCell>
                <TableCell>{customer.phone || "-"}</TableCell>
                <TableCell>
                  <Badge variant={customer.ordersCount > 0 ? "default" : "secondary"}>
                    {customer.ordersCount}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.lastOrderDate 
                    ? format(parseISO(customer.lastOrderDate), "dd/MM/yyyy")
                    : "Nunca"
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {data.length > 10 && (
        <div className="p-3 bg-muted/30 text-center text-sm text-muted-foreground">
          + {data.length - 10} clientes adicionais
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout title="Marketing">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <p className="text-xl font-bold mt-1">{stats.totalCustomers}</p>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 bg-pink-500/5 border-pink-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Cake className="w-4 h-4 text-pink-500" />
                <span className="text-xs text-muted-foreground">Aniversários</span>
              </div>
              <p className="text-xl font-bold mt-1 text-pink-600">{stats.birthdaysThisMonth}</p>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">VIP</span>
              </div>
              <p className="text-xl font-bold mt-1 text-amber-600">{stats.vipCount}</p>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Novos</span>
              </div>
              <p className="text-xl font-bold mt-1 text-emerald-600">{stats.newThisMonth}</p>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 bg-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Recorrentes</span>
              </div>
              <p className="text-xl font-bold mt-1 text-blue-600">{stats.recurrent}</p>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 bg-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Inativos</span>
              </div>
              <p className="text-xl font-bold mt-1 text-orange-600">{stats.inactiveCount}</p>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 bg-gray-500/5 border-gray-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-muted-foreground">Sem pedidos</span>
              </div>
              <p className="text-xl font-bold mt-1 text-gray-600">{stats.noOrders}</p>
            </CardContent>
          </Card>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="birthdays" className="space-y-4">
            <motion.div variants={itemVariants}>
              <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                <TabsTrigger value="birthdays" className="gap-2">
                  <Cake className="w-4 h-4" />
                  Aniversariantes
                </TabsTrigger>
                <TabsTrigger value="vip" className="gap-2">
                  <Star className="w-4 h-4" />
                  VIP
                </TabsTrigger>
                <TabsTrigger value="recurrent" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recorrentes
                </TabsTrigger>
                <TabsTrigger value="inactive" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Inativos
                </TabsTrigger>
                <TabsTrigger value="new" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Novos
                </TabsTrigger>
                <TabsTrigger value="no_orders" className="gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Sem Pedidos
                </TabsTrigger>
              </TabsList>
            </motion.div>

            {/* Birthdays Tab */}
            <TabsContent value="birthdays" className="space-y-4">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Cake className="w-5 h-5 text-pink-500" />
                          Aniversariantes do Mês
                        </CardTitle>
                        <CardDescription>
                          Clientes que fazem aniversário no mês selecionado
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map(month => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={() => handleExportClick("birthdays")} 
                          variant="outline"
                          disabled={birthdayCustomers.length === 0}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Exportar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CustomerTable 
                      data={birthdayCustomers} 
                      emptyMessage="Nenhum aniversariante encontrado para este mês"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* VIP Tab */}
            <TabsContent value="vip" className="space-y-4">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-500" />
                          Clientes VIP
                        </CardTitle>
                        <CardDescription>
                          Top 10% dos clientes por valor gasto
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => handleExportClick("vip")} 
                        variant="outline"
                        disabled={vipCustomers.length === 0}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CustomerTable 
                      data={vipCustomers} 
                      emptyMessage="Nenhum cliente VIP encontrado"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Recurrent Tab */}
            <TabsContent value="recurrent" className="space-y-4">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          Clientes Recorrentes
                        </CardTitle>
                        <CardDescription>
                          Clientes com 3 ou mais pedidos
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => handleExportClick("recurrent")} 
                        variant="outline"
                        disabled={recurrentCustomers.length === 0}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CustomerTable 
                      data={recurrentCustomers} 
                      emptyMessage="Nenhum cliente recorrente encontrado"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Inactive Tab */}
            <TabsContent value="inactive" className="space-y-4">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-500" />
                          Clientes Inativos
                        </CardTitle>
                        <CardDescription>
                          Clientes sem pedidos há mais de 60 dias
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => handleExportClick("inactive")} 
                        variant="outline"
                        disabled={inactiveCustomers.length === 0}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CustomerTable 
                      data={inactiveCustomers} 
                      emptyMessage="Nenhum cliente inativo encontrado"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* New Customers Tab */}
            <TabsContent value="new" className="space-y-4">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-emerald-500" />
                          Novos Clientes
                        </CardTitle>
                        <CardDescription>
                          Clientes cadastrados este mês
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => handleExportClick("new")} 
                        variant="outline"
                        disabled={newCustomers.length === 0}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CustomerTable 
                      data={newCustomers} 
                      emptyMessage="Nenhum cliente novo este mês"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* No Orders Tab */}
            <TabsContent value="no_orders" className="space-y-4">
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-gray-500" />
                          Clientes Sem Pedidos
                        </CardTitle>
                        <CardDescription>
                          Clientes cadastrados que nunca fizeram um pedido
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => handleExportClick("no_orders")} 
                        variant="outline"
                        disabled={noOrderCustomers.length === 0}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CustomerTable 
                      data={noOrderCustomers} 
                      emptyMessage="Todos os clientes já fizeram pelo menos um pedido!"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        )}
      </motion.div>

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        columns={exportColumns}
        data={getExportData()}
        filename={getExportFilename()}
        title="Exportar Clientes"
      />
    </AdminLayout>
  );
}