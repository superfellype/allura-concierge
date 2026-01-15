import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit, Check, Bell, Clock } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { notesService, Note } from "@/services/notes.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const NOTE_COLORS = [
  { id: 'yellow', bg: 'bg-amber-100 dark:bg-amber-800/40', text: 'text-amber-900 dark:text-amber-100' },
  { id: 'pink', bg: 'bg-pink-100 dark:bg-pink-800/40', text: 'text-pink-900 dark:text-pink-100' },
  { id: 'blue', bg: 'bg-sky-100 dark:bg-sky-800/40', text: 'text-sky-900 dark:text-sky-100' },
  { id: 'green', bg: 'bg-emerald-100 dark:bg-emerald-800/40', text: 'text-emerald-900 dark:text-emerald-100' },
  { id: 'purple', bg: 'bg-violet-100 dark:bg-violet-800/40', text: 'text-violet-900 dark:text-violet-100' },
];

export default function Notas() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'yellow',
    reminder_at: ''
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    const { data, error } = await notesService.getAll();
    if (error) {
      toast.error("Erro ao carregar notas");
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content || '',
        color: note.color,
        reminder_at: note.reminder_at ? note.reminder_at.slice(0, 16) : ''
      });
    } else {
      setEditingNote(null);
      setFormData({ title: '', content: '', color: 'yellow', reminder_at: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    const payload = {
      title: formData.title,
      content: formData.content || undefined,
      color: formData.color,
      reminder_at: formData.reminder_at ? new Date(formData.reminder_at).toISOString() : null
    };

    if (editingNote) {
      const { error } = await notesService.update(editingNote.id, payload);
      if (error) {
        toast.error("Erro ao atualizar nota");
      } else {
        toast.success("Nota atualizada!");
        loadNotes();
      }
    } else {
      const { error } = await notesService.create(payload);
      if (error) {
        toast.error("Erro ao criar nota");
      } else {
        toast.success("Nota criada!");
        loadNotes();
      }
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await notesService.delete(id);
    if (error) {
      toast.error("Erro ao excluir nota");
    } else {
      toast.success("Nota excluída!");
      loadNotes();
    }
  };

  const handleToggleComplete = async (note: Note) => {
    const { error } = await notesService.toggleComplete(note.id, !note.is_completed);
    if (error) {
      toast.error("Erro ao atualizar nota");
    } else {
      loadNotes();
    }
  };

  const getNoteColor = (colorId: string) => {
    return NOTE_COLORS.find(c => c.id === colorId) || NOTE_COLORS[0];
  };

  const filteredNotes = showCompleted 
    ? notes 
    : notes.filter(n => !n.is_completed);

  const activeCount = notes.filter(n => !n.is_completed).length;
  const completedCount = notes.filter(n => n.is_completed).length;

  return (
    <AdminLayout title="Notas">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              {activeCount} ativa{activeCount !== 1 ? 's' : ''} • {completedCount} concluída{completedCount !== 1 ? 's' : ''}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox 
                checked={showCompleted}
                onCheckedChange={(checked) => setShowCompleted(!!checked)}
              />
              Mostrar concluídas
            </label>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Nota
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma nota encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotes.map(note => {
              const color = getNoteColor(note.color);
              const hasReminder = note.reminder_at && new Date(note.reminder_at) > new Date();
              
              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`${color.bg} ${color.text} rounded-xl p-4 shadow-sm hover:shadow-md transition-all min-h-[150px] flex flex-col ${
                    note.is_completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={note.is_completed}
                        onCheckedChange={() => handleToggleComplete(note)}
                      />
                      <h3 className={`font-semibold ${note.is_completed ? 'line-through' : ''}`}>
                        {note.title}
                      </h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenDialog(note)}
                        className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {note.content && (
                    <p className="text-sm opacity-80 flex-1 whitespace-pre-wrap line-clamp-4">
                      {note.content}
                    </p>
                  )}

                  <div className="mt-auto pt-3 flex items-center justify-between text-xs opacity-70">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(note.created_at), "dd MMM", { locale: ptBR })}
                    </span>
                    {hasReminder && (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Bell className="w-3 h-3" />
                        {format(new Date(note.reminder_at!), "dd/MM HH:mm")}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="sm:max-w-md bg-card border border-border"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Editar Nota' : 'Nova Nota'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título da nota"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Escreva sua nota..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Lembrete</label>
              <Input
                type="datetime-local"
                value={formData.reminder_at}
                onChange={(e) => setFormData({ ...formData, reminder_at: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Cor</label>
              <div className="flex gap-2 mt-2">
                {NOTE_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setFormData({ ...formData, color: color.id })}
                    className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center ${
                      formData.color === color.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    {formData.color === color.id && <Check className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingNote ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
