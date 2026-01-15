import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit, TrendingUp, TrendingDown, Filter, Calendar, Download } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { expensesService, Expense, EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from "@/services/expenses.service";
import { formatCurrency } from "@/lib/price-utils";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/lib/export-utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Despesas() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
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

  const handleDelete = async (id: string) => {
    const { error } = await expensesService.delete(id);
    if (error) {
      toast.error("Erro ao excluir despesa");
    } else {
      toast.success("Despesa excluída!");
      loadExpenses();
      loadStats();
    }
  };

  const handleExport = () => {
    const dataToExport = filteredExpenses.map(e => ({
      Descrição: e.description,
      Categoria: e.category,
      Valor: formatCurrencyForExport(Number(e.amount)),
      Data: formatDateForExport(e.expense_date),
      'Forma de Pagamento': e.payment_method || '-',
      Observações: e.notes || '-'
    }));
    exportToCSV(dataToExport, `despesas-${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success("Despesas exportadas!");
  };

  const filteredExpenses = filterCategory === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === filterCategory);

  const monthChange = stats.totalLastMonth > 0 
    ? ((stats.totalMonth - stats.totalLastMonth) / stats.totalLastMonth) * 100 
    : 0;

  return (
    <AdminLayout title="Despesas">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Despesa
            </Button>
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
                          onClick={() => handleDelete(expense.id)}
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
    </AdminLayout>
  );
}
