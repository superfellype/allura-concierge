import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, GripVertical, Trash2, Edit, X, Check } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { kanbanNotesService, KanbanNote, KANBAN_COLUMNS } from "@/services/kanban-notes.service";

const NOTE_COLORS = [
  { id: 'yellow', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-300' },
  { id: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300' },
  { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300' },
  { id: 'green', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-300' },
  { id: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300' },
];

export default function NotasKanban() {
  const [notes, setNotes] = useState<KanbanNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<KanbanNote | null>(null);
  const [draggedNote, setDraggedNote] = useState<KanbanNote | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    column_id: 'todo',
    color: 'yellow'
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    const { data, error } = await kanbanNotesService.getAll();
    if (error) {
      toast.error("Erro ao carregar notas");
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (note?: KanbanNote) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content || '',
        column_id: note.column_id,
        color: note.color
      });
    } else {
      setEditingNote(null);
      setFormData({ title: '', content: '', column_id: 'todo', color: 'yellow' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (editingNote) {
      const { error } = await kanbanNotesService.update(editingNote.id, formData);
      if (error) {
        toast.error("Erro ao atualizar nota");
      } else {
        toast.success("Nota atualizada!");
        loadNotes();
      }
    } else {
      const { error } = await kanbanNotesService.create(formData);
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
    const { error } = await kanbanNotesService.delete(id);
    if (error) {
      toast.error("Erro ao excluir nota");
    } else {
      toast.success("Nota excluída!");
      loadNotes();
    }
  };

  const handleDragStart = (note: KanbanNote) => {
    setDraggedNote(note);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (columnId: string) => {
    if (!draggedNote || draggedNote.column_id === columnId) {
      setDraggedNote(null);
      return;
    }

    const { error } = await kanbanNotesService.moveToColumn(draggedNote.id, columnId, 0);
    if (error) {
      toast.error("Erro ao mover nota");
    } else {
      loadNotes();
    }
    setDraggedNote(null);
  };

  const getNoteColor = (colorId: string) => {
    return NOTE_COLORS.find(c => c.id === colorId) || NOTE_COLORS[0];
  };

  const getColumnNotes = (columnId: string) => {
    return notes.filter(n => n.column_id === columnId);
  };

  return (
    <AdminLayout title="Quadro de Notas">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Organize suas tarefas e anotações
          </p>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Nota
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {KANBAN_COLUMNS.map(column => (
              <div
                key={column.id}
                className={`rounded-xl p-4 min-h-[400px] ${column.color} border border-border/50`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">{column.title}</h3>
                  <span className="text-xs bg-background/50 px-2 py-1 rounded-full">
                    {getColumnNotes(column.id).length}
                  </span>
                </div>

                <div className="space-y-3">
                  {getColumnNotes(column.id).map(note => {
                    const color = getNoteColor(note.color);
                    return (
                      <motion.div
                        key={note.id}
                        layout
                        draggable
                        onDragStart={() => handleDragStart(note)}
                        className={`${color.bg} ${color.border} border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-foreground truncate">{note.title}</h4>
                            {note.content && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {note.content}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleOpenDialog(note)}
                              className="p-1 hover:bg-background/50 rounded"
                            >
                              <Edit className="w-3 h-3 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(note.id)}
                              className="p-1 hover:bg-background/50 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
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
                placeholder="Descrição ou detalhes..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Coluna</label>
              <Select
                value={formData.column_id}
                onValueChange={(value) => setFormData({ ...formData, column_id: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KANBAN_COLUMNS.map(col => (
                    <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Cor</label>
              <div className="flex gap-2 mt-2">
                {NOTE_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setFormData({ ...formData, color: color.id })}
                    className={`w-8 h-8 rounded-full ${color.bg} ${color.border} border-2 flex items-center justify-center ${
                      formData.color === color.id ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    {formData.color === color.id && <Check className="w-4 h-4" />}
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
