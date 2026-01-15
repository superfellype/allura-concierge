import { supabase } from "@/integrations/supabase/client";

export interface Expense {
  id: string;
  user_id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInput {
  description: string;
  category: string;
  amount: number;
  expense_date?: string;
  payment_method?: string;
  notes?: string;
}

export const EXPENSE_CATEGORIES = [
  'Aluguel',
  'Fornecedores',
  'Marketing',
  'Operacional',
  'Salários',
  'Impostos',
  'Manutenção',
  'Transporte',
  'Outros'
];

export const EXPENSE_PAYMENT_METHODS = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto',
  'Dinheiro',
  'Transferência'
];

class ExpensesService {
  async getAll(): Promise<{ data: Expense[] | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false });

    return { data: data as Expense[] | null, error };
  }

  async getByPeriod(startDate: string, endDate: string): Promise<{ data: Expense[] | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    return { data: data as Expense[] | null, error };
  }

  async getByCategory(category: string): Promise<{ data: Expense[] | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('category', category)
      .order('expense_date', { ascending: false });

    return { data: data as Expense[] | null, error };
  }

  async create(input: ExpenseInput): Promise<{ data: Expense | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        description: input.description,
        category: input.category,
        amount: input.amount,
        expense_date: input.expense_date || new Date().toISOString().split('T')[0],
        payment_method: input.payment_method || null,
        notes: input.notes || null
      })
      .select()
      .single();

    return { data: data as Expense | null, error };
  }

  async update(id: string, input: Partial<ExpenseInput>): Promise<{ data: Expense | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('expenses')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    return { data: data as Expense | null, error };
  }

  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    return { error };
  }

  async getStats(): Promise<{
    totalMonth: number;
    totalLastMonth: number;
    byCategory: Record<string, number>;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const { data: currentMonth } = await this.getByPeriod(startOfMonth, endOfMonth);
    const { data: lastMonth } = await this.getByPeriod(startOfLastMonth, endOfLastMonth);

    const totalMonth = currentMonth?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const totalLastMonth = lastMonth?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const byCategory: Record<string, number> = {};
    currentMonth?.forEach(expense => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + Number(expense.amount);
    });

    return { totalMonth, totalLastMonth, byCategory };
  }
}

export const expensesService = new ExpensesService();
