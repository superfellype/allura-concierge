import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, GripVertical, Trash2, Edit, Check, StickyNote } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { kanbanNotesService, KanbanNote, KANBAN_COLUMNS } from "@/services/kanban-notes.service";

const NOTE_COLORS = [
  { id: 'yellow', bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-900 dark:text-amber-100' },
  { id: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-900 dark:text-pink-100' },
  { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-900 dark:text-blue-100' },
  { id: 'green', bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-900 dark:text-emerald-100' },
  { id: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-900 dark:text-purple-100' },
];

const COLUMN_STYLES = {
  todo: { bg: 'bg-slate-100/50 dark:bg-slate-800/30', headerBg: 'bg-slate-200/80 dark:bg-slate-700/50' },
  doing: { bg: 'bg-amber-50/50 dark:bg-amber-900/20', headerBg: 'bg-amber-200/80 dark:bg-amber-800/50' },
  done: { bg: 'bg-emerald-50/50 dark:bg-emerald-900/20', headerBg: 'bg-emerald-200/80 dark:bg-emerald-800/50' },
};

const NotasKanban = () => {
  const [notes, setNotes] = useState<KanbanNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<KanbanNote | null>(null);
  const [draggedNote, setDraggedNote] = useState<KanbanNote | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
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

  const handleOpenDialog = (note?: KanbanNote, columnId?: string) => {
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
      setFormData({ title: '', content: '', column_id: columnId || 'todo', color: 'yellow' });
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

  const handleDragStart = (e: React.DragEvent, note: KanbanNote) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
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
    <AdminLayout title="Quadro de Atividades">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-muted-foreground">
              Organize suas tarefas e anotações do dia a dia
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Nova Atividade
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {KANBAN_COLUMNS.map(column => {
              const columnStyle = COLUMN_STYLES[column.id as keyof typeof COLUMN_STYLES];
              const columnNotes = getColumnNotes(column.id);
              const isOver = dragOverColumn === column.id;
              
              return (
                <div
                  key={column.id}
                  className={`rounded-2xl min-h-[500px] flex flex-col transition-all duration-200 ${columnStyle.bg} ${
                    isOver ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column Header */}
                  <div className={`${columnStyle.headerBg} rounded-t-2xl px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{column.title}</h3>
                      <span className="text-xs bg-background/60 px-2 py-0.5 rounded-full font-medium">
                        {columnNotes.length}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => handleOpenDialog(undefined, column.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Column Body */}
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                    <AnimatePresence mode="popLayout">
                      {columnNotes.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-12 text-muted-foreground"
                        >
                          <StickyNote className="w-10 h-10 opacity-30 mb-2" />
                          <p className="text-sm">Nenhuma atividade</p>
                        </motion.div>
                      ) : (
                        columnNotes.map(note => {
                          const color = getNoteColor(note.color);
                          return (
                            <motion.div
                              key={note.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              draggable
                              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, note)}
                              className={`${color.bg} ${color.border} ${color.text} border-2 rounded-xl p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all group`}
                            >
                              <div className="flex items-start gap-2">
                                <GripVertical className="w-4 h-4 opacity-30 group-hover:opacity-60 mt-0.5 flex-shrink-0 transition-opacity" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate">{note.title}</h4>
                                  {note.content && (
                                    <p className="text-xs opacity-70 mt-1.5 line-clamp-3 whitespace-pre-wrap">
                                      {note.content}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleOpenDialog(note)}
                                    className="p-1.5 hover:bg-background/50 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(note.id)}
                                    className="p-1.5 hover:bg-destructive/20 rounded-lg transition-colors text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog with improved animation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent 
          className="sm:max-w-md bg-card border border-border shadow-2xl"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingNote ? 'Editar Atividade' : 'Nova Atividade'}
            </DialogTitle>
            <DialogDescription>
              {editingNote ? 'Atualize os detalhes da atividade' : 'Crie uma nova atividade para o quadro'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Título *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="O que precisa ser feito?"
                className="bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Descrição</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Detalhes, observações..."
                rows={4}
                className="bg-background resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Coluna</label>
                <Select
                  value={formData.column_id}
                  onValueChange={(value) => setFormData({ ...formData, column_id: value })}
                >
                  <SelectTrigger className="bg-background">
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
                <label className="text-sm font-medium mb-1.5 block">Cor</label>
                <div className="flex gap-2 mt-1.5">
                  {NOTE_COLORS.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.id })}
                      className={`w-8 h-8 rounded-full ${color.bg} ${color.border} border-2 flex items-center justify-center transition-all ${
                        formData.color === color.id ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                    >
                      {formData.color === color.id && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingNote ? 'Salvar Alterações' : 'Criar Atividade'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default NotasKanban;
