import { supabase } from "@/integrations/supabase/client";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  color: string;
  reminder_at: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  content?: string;
  color?: string;
  reminder_at?: string | null;
  is_completed?: boolean;
}

class NotesService {
  async getAll(): Promise<{ data: Note[] | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return { data: data as Note[] | null, error };
  }

  async getActive(): Promise<{ data: Note[] | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false });

    return { data: data as Note[] | null, error };
  }

  async create(input: NoteInput): Promise<{ data: Note | null; error: Error | null }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: input.title,
        content: input.content || null,
        color: input.color || 'yellow',
        reminder_at: input.reminder_at || null,
        is_completed: input.is_completed || false
      })
      .select()
      .single();

    return { data: data as Note | null, error };
  }

  async update(id: string, input: Partial<NoteInput>): Promise<{ data: Note | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('notes')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    return { data: data as Note | null, error };
  }

  async delete(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    return { error };
  }

  async toggleComplete(id: string, isCompleted: boolean): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('notes')
      .update({ is_completed: isCompleted })
      .eq('id', id);

    return { error };
  }
}

export const notesService = new NotesService();
