import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, GripVertical, Image as ImageIcon, Check, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { categoriesService, Category, CategoryInput } from "@/services/categories.service";
import { uploadService } from "@/services/upload.service";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Categorias = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<CategoryInput>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await categoriesService.getAll();
    if (error) {
      toast.error('Erro ao carregar categorias');
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true
    });
    setEditingCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image_url: category.image_url || '',
      is_active: category.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);

    try {
      if (editingCategory) {
        const { error } = await categoriesService.update(editingCategory.id, form);
        if (error) throw error;
        toast.success('Categoria atualizada');
      } else {
        const { error } = await categoriesService.create(form);
        if (error) throw error;
        toast.success('Categoria criada');
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await categoriesService.delete(deleteId);
      if (error) throw error;
      toast.success('Categoria excluída');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir categoria');
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    const { error } = await categoriesService.toggleActive(id, !currentValue);
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      setCategories(prev => prev.map(c => 
        c.id === id ? { ...c, is_active: !currentValue } : c
      ));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { url, error } = await uploadService.uploadProductImage(file);
    if (error) {
      toast.error('Erro ao fazer upload da imagem');
    } else if (url) {
      setForm(prev => ({ ...prev, image_url: url }));
      toast.success('Imagem enviada');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <AdminLayout title="Categorias">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground font-body">
            Gerencie as categorias de produtos da loja.
          </p>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="glass-btn">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-card border border-border shadow-xl" onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div>
                  <Label htmlFor="name" className="font-body">Nome</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => {
                      setForm(prev => ({ 
                        ...prev, 
                        name: e.target.value,
                        slug: editingCategory ? prev.slug : generateSlug(e.target.value)
                      }));
                    }}
                    placeholder="Ex: Bolsas"
                    className="mt-1.5 glass-input"
                  />
                </div>

                <div>
                  <Label htmlFor="slug" className="font-body">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="bolsas"
                    className="mt-1.5 glass-input"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="font-body">Descrição</Label>
                  <Textarea
                    id="description"
                    value={form.description || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da categoria..."
                    className="mt-1.5 glass-input min-h-[80px]"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="font-body">Imagem</Label>
                  <div className="mt-1.5 flex items-center gap-4">
                    {form.image_url ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted/30">
                        <img
                          src={form.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                          className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active" className="font-body">Ativa</Label>
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                    className="glass-btn-secondary"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="glass-btn"
                  >
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories List */}
        <div className="liquid-glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground font-body">
              Carregando categorias...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground font-body">
              Nenhuma categoria cadastrada.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                  
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate font-body">{category.name}</h3>
                    <p className="text-sm text-muted-foreground truncate font-body">
                      /{category.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(category.id, category.is_active)}
                      className={`status-badge ${
                        category.is_active
                          ? 'status-badge-success'
                          : 'status-badge-neutral'
                      }`}
                    >
                      {category.is_active ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ativa
                        </span>
                      ) : (
                        'Inativa'
                      )}
                    </button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(category)}
                      className="hover:bg-secondary/50"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(category.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Categoria"
        description="Tem certeza que deseja excluir esta categoria? Os produtos associados não serão excluídos."
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AdminLayout>
  );
};

export default Categorias;