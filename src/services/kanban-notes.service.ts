import { supabase } from "@/integrations/supabase/client";

export interface KanbanNote {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  column_id: string;
  display_order: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanNoteInput {
  title: string;
  content?: string;
  column_id?: string;
  display_order?: number;
  color?: string;
}

export const KANBAN_COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'bg-amber-500/20' },
  { id: 'in_progress', title: 'Em Andamento', color: 'bg-blue-500/20' },
  { id: 'done', title: 'Concluído', color: 'bg-emerald-500/20' }
];

class KanbanNotesService {
  async getAll(): Promise<{ data: KanbanNote[] | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
      .from('kanban_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });

    return { data: data as KanbanNote[] | null, error };
  }

  async create(input: KanbanNoteInput): Promise<{ data: KanbanNote | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
      .from('kanban_notes')
      .insert({
        user_id: user.id,
        title: input.title,
        content: input.content || null,
        column_id: input.column_id || 'todo',
        display_order: input.display_order || 0,
        color: input.color || 'yellow'
      })
      .select()
      .single();

    return { data: data as KanbanNote | null, error };
  }

  async update(id: string, input: Partial<KanbanNoteInput>): Promise<{ data: KanbanNote | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('kanban_notes')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    return { data: data as KanbanNote | null, error };
  }

  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('kanban_notes')
      .delete()
      .eq('id', id);

    return { error };
  }

  async moveToColumn(id: string, columnId: string, displayOrder: number): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('kanban_notes')
      .update({ column_id: columnId, display_order: displayOrder })
      .eq('id', id);

    return { error };
  }

  async reorder(notes: { id: string; display_order: number }[]): Promise<{ error: Error | null }> {
    for (const note of notes) {
      const { error } = await supabase
        .from('kanban_notes')
        .update({ display_order: note.display_order })
        .eq('id', note.id);
      
      if (error) return { error };
    }
    return { error: null };
  }
}

export const kanbanNotesService = new KanbanNotesService();
