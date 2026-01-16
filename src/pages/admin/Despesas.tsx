import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit, TrendingUp, TrendingDown, Filter, Calendar, Download, Search, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import { expensesService, Expense, EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from "@/services/expenses.service";
import { formatCurrency } from "@/lib/price-utils";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/lib/export-utils";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, startOfYear, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { ExportModal, ExportColumn } from "@/components/admin/ExportModal";

type DatePreset = "all" | "today" | "week" | "month" | "last_month" | "year" | "custom";

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "today", label: "Hoje" },
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mês" },
  { id: "last_month", label: "Mês passado" },
  { id: "year", label: "Este ano" },
  { id: "custom", label: "Personalizado" },
];

export default function Despesas() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  
  // Export
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  const [stats, setStats] = useState({ totalMonth: 0, totalLastMonth: 0, byCategory: {} as Record<string, number> });
  
  const [formData, setFormData] = useState({
    description: '',
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: ''
  });

  useEffect(() => {
    loadExpenses();
    loadStats();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    const { data, error } = await expensesService.getAll();
    if (error) {
      toast.error("Erro ao carregar despesas");
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const statsData = await expensesService.getStats();
    setStats(statsData);
  };

  const getDateRange = (): { start: Date; end: Date } | null => {
    const now = new Date();
    switch (datePreset) {
      case "today":
        return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
      case "week":
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "year":
        return { start: startOfYear(now), end: now };
      case "custom":
        if (customDateRange?.from && customDateRange?.to) {
          return { start: customDateRange.from, end: customDateRange.to };
        }
        return null;
      default:
        return null;
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Search filter
      const matchesSearch = !searchQuery || 
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.notes?.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Category filter
      const matchesCategory = filterCategory === "all" || expense.category === filterCategory;
      
      // Payment method filter
      const matchesPayment = filterPaymentMethod === "all" || expense.payment_method === filterPaymentMethod;
      
      // Date filter
      const dateRange = getDateRange();
      const matchesDate = !dateRange || isWithinInterval(parseISO(expense.expense_date), {
        start: dateRange.start,
        end: dateRange.end
      });
      
      return matchesSearch && matchesCategory && matchesPayment && matchesDate;
    });
  }, [expenses, searchQuery, filterCategory, filterPaymentMethod, datePreset, customDateRange]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filteredExpenses]);

  const activeFiltersCount = [
    searchQuery !== "",
    filterCategory !== "all",
    filterPaymentMethod !== "all",
    datePreset !== "all"
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterPaymentMethod("all");
    setDatePreset("all");
    setCustomDateRange(undefined);
  };

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        category: expense.category,
        amount: String(expense.amount),
        expense_date: expense.expense_date,
        payment_method: expense.payment_method || '',
        notes: expense.notes || ''
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: '',
        category: EXPENSE_CATEGORIES[0],
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.description.trim() || !formData.amount) {
      toast.error("Descrição e valor são obrigatórios");
      return;
    }

    const payload = {
      description: formData.description,
      category: formData.category,
      amount: parseFloat(formData.amount),
      expense_date: formData.expense_date,
      payment_method: formData.payment_method || undefined,
      notes: formData.notes || undefined
    };

    if (editingExpense) {
      const { error } = await expensesService.update(editingExpense.id, payload);
      if (error) {
        toast.error("Erro ao atualizar despesa");
      } else {
        toast.success("Despesa atualizada!");
        loadExpenses();
        loadStats();
      }
    } else {
      const { error } = await expensesService.create(payload);
      if (error) {
        toast.error("Erro ao criar despesa");
      } else {
        toast.success("Despesa criada!");
        loadExpenses();
        loadStats();
      }
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    
    const { error } = await expensesService.delete(expenseToDelete.id);
    if (error) {
      toast.error("Erro ao excluir despesa");
    } else {
      toast.success("Despesa excluída!");
      loadExpenses();
      loadStats();
    }
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  const exportColumns: ExportColumn[] = [
    { key: "description", label: "Descrição", defaultEnabled: true },
    { key: "category", label: "Categoria", defaultEnabled: true },
    { key: "amount", label: "Valor", defaultEnabled: true, format: (v) => formatCurrencyForExport(Number(v)) },
    { key: "expense_date", label: "Data", defaultEnabled: true, format: (v) => formatDateForExport(v) },
    { key: "payment_method", label: "Forma de Pagamento", defaultEnabled: true, format: (v) => v || "-" },
    { key: "notes", label: "Observações", defaultEnabled: false, format: (v) => v || "-" },
  ];

  const monthChange = stats.totalLastMonth > 0 
    ? ((stats.totalMonth - stats.totalLastMonth) / stats.totalLastMonth) * 100 
    : 0;

  return (
    <AdminLayout title="Despesas">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Despesas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalMonth)}</div>
              {stats.totalLastMonth > 0 && (
                <div className={`flex items-center gap-1 text-sm ${monthChange > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  {monthChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(monthChange).toFixed(1)}% vs mês anterior
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Mês Anterior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalLastMonth)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Maior Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.byCategory).length > 0 ? (
                <>
                  <div className="text-lg font-bold">
                    {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0]?.[1] || 0)}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">-</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary">
                Total Filtrado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(filteredTotal)}</div>
              <div className="text-sm text-muted-foreground">
                {filteredExpenses.length} despesa(s)
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Preset */}
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 min-w-[160px] justify-start">
                  <Calendar className="w-4 h-4" />
                  {DATE_PRESETS.find(p => p.id === datePreset)?.label}
                  {datePreset === "custom" && customDateRange?.from && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({format(customDateRange.from, "dd/MM")} - {customDateRange.to ? format(customDateRange.to, "dd/MM") : "..."})
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 border-b">
                  <div className="grid grid-cols-2 gap-1">
                    {DATE_PRESETS.map(preset => (
                      <Button
                        key={preset.id}
                        variant={datePreset === preset.id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setDatePreset(preset.id);
                          if (preset.id !== "custom") {
                            setDatePopoverOpen(false);
                          }
                        }}
                        className="justify-start"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {datePreset === "custom" && (
                  <CalendarComponent
                    mode="range"
                    selected={customDateRange}
                    onSelect={(range) => {
                      setCustomDateRange(range);
                      if (range?.from && range?.to) {
                        setDatePopoverOpen(false);
                      }
                    }}
                    locale={ptBR}
                    numberOfMonths={2}
                  />
                )}
              </PopoverContent>
            </Popover>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Method Filter */}
            <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos pagamentos</SelectItem>
                {EXPENSE_PAYMENT_METHODS.map(method => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {activeFiltersCount > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Busca: "{searchQuery}"
                      <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {filterCategory !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {filterCategory}
                      <button onClick={() => setFilterCategory("all")} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {filterPaymentMethod !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {filterPaymentMethod}
                      <button onClick={() => setFilterPaymentMethod("all")} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {datePreset !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      {DATE_PRESETS.find(p => p.id === datePreset)?.label}
                      <button onClick={() => setDatePreset("all")} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                    Limpar todos
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setExportModalOpen(true)} className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Despesa
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma despesa encontrada</p>
            {activeFiltersCount > 0 && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {expense.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-muted rounded-md text-xs">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(expense.expense_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{expense.payment_method || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(expense.amount))}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenDialog(expense)}
                          className="p-1.5 hover:bg-muted rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(expense)}
                          className="p-1.5 hover:bg-muted rounded text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Descrição *</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Conta de luz"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Categoria *</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Valor *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data *</label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Forma de Pagamento</label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_PAYMENT_METHODS.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionais..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingExpense ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Despesa"
        description={`Tem certeza que deseja excluir a despesa "${expenseToDelete?.description}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />

      {/* Export Modal */}
      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        columns={exportColumns}
        data={filteredExpenses}
        filename={`despesas-${format(new Date(), 'yyyy-MM-dd')}`}
        title="Exportar Despesas"
      />
    </AdminLayout>
  );
}