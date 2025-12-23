import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Image as ImageIcon, Star, Calendar, Check, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { collectionsService, Collection, CollectionInput } from "@/services/collections.service";
import { uploadService } from "@/services/upload.service";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { format } from "date-fns";

const Colecoes = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<CollectionInput>({
    name: '',
    slug: '',
    editorial_description: '',
    cover_image_url: '',
    start_date: null,
    end_date: null,
    highlight_on_home: false,
    is_active: true
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setLoading(true);
    const { data, error } = await collectionsService.getAll();
    if (error) {
      toast.error('Erro ao carregar coleções');
    } else {
      setCollections(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      name: '',
      slug: '',
      editorial_description: '',
      cover_image_url: '',
      start_date: null,
      end_date: null,
      highlight_on_home: false,
      is_active: true
    });
    setEditingCollection(null);
  };

  const openEditDialog = (collection: Collection) => {
    setEditingCollection(collection);
    setForm({
      name: collection.name,
      slug: collection.slug,
      editorial_description: collection.editorial_description || '',
      cover_image_url: collection.cover_image_url || '',
      start_date: collection.start_date,
      end_date: collection.end_date,
      highlight_on_home: collection.highlight_on_home,
      is_active: collection.is_active
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
      if (editingCollection) {
        const { error } = await collectionsService.update(editingCollection.id, form);
        if (error) throw error;
        toast.success('Coleção atualizada');
      } else {
        const { error } = await collectionsService.create(form);
        if (error) throw error;
        toast.success('Coleção criada');
      }

      setDialogOpen(false);
      resetForm();
      fetchCollections();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar coleção');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await collectionsService.delete(deleteId);
      if (error) throw error;
      toast.success('Coleção excluída');
      fetchCollections();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir coleção');
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    const { error } = await collectionsService.toggleActive(id, !currentValue);
    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      setCollections(prev => prev.map(c => 
        c.id === id ? { ...c, is_active: !currentValue } : c
      ));
    }
  };

  const handleToggleHighlight = async (id: string, currentValue: boolean) => {
    const { error } = await collectionsService.toggleHighlight(id, !currentValue);
    if (error) {
      toast.error('Erro ao atualizar destaque');
    } else {
      setCollections(prev => prev.map(c => 
        c.id === id ? { ...c, highlight_on_home: !currentValue } : c
      ));
      toast.success(!currentValue ? 'Coleção destacada na home' : 'Destaque removido');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { url, error } = await uploadService.uploadProductImage(file);
    if (error) {
      toast.error('Erro ao fazer upload da imagem');
    } else if (url) {
      setForm(prev => ({ ...prev, cover_image_url: url }));
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
    <AdminLayout title="Coleções">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground font-body">
            Coleções são grupos editoriais de produtos para campanhas e destaques.
          </p>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="glass-btn">
                <Plus className="w-4 h-4 mr-2" />
                Nova Coleção
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto modal-overlay liquid-glass-card border-0">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  {editingCollection ? 'Editar Coleção' : 'Nova Coleção'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name" className="font-body text-sm">Nome</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => {
                      setForm(prev => ({ 
                        ...prev, 
                        name: e.target.value,
                        slug: editingCollection ? prev.slug : generateSlug(e.target.value)
                      }));
                    }}
                    placeholder="Ex: Verão 2025"
                    className="mt-1 glass-input"
                  />
                </div>

                <div>
                  <Label htmlFor="slug" className="font-body text-sm">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="verao-2025"
                    className="mt-1 glass-input"
                  />
                </div>

                <div>
                  <Label htmlFor="editorial_description" className="font-body text-sm">Descrição Editorial</Label>
                  <Textarea
                    id="editorial_description"
                    value={form.editorial_description || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, editorial_description: e.target.value }))}
                    placeholder="Uma descrição rica para a coleção..."
                    className="mt-1 glass-input min-h-[100px]"
                    rows={4}
                  />
                </div>

                <div>
                  <Label className="font-body text-sm">Imagem de Capa</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {form.cover_image_url ? (
                      <div className="relative w-32 h-20 rounded-xl overflow-hidden liquid-glass-card">
                        <img
                          src={form.cover_image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setForm(prev => ({ ...prev, cover_image_url: '' }))}
                          className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-32 h-20 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all liquid-glass-card">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date" className="font-body text-sm">Data de Início</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={form.start_date ? form.start_date.slice(0, 16) : ''}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        start_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                      }))}
                      className="mt-1 glass-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date" className="font-body text-sm">Data de Fim</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={form.end_date ? form.end_date.slice(0, 16) : ''}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        end_date: e.target.value ? new Date(e.target.value).toISOString() : null 
                      }))}
                      className="mt-1 glass-input"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl liquid-glass-card">
                  <Label htmlFor="highlight_on_home" className="font-body text-sm cursor-pointer">Destacar na Home</Label>
                  <Switch
                    id="highlight_on_home"
                    checked={form.highlight_on_home}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, highlight_on_home: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl liquid-glass-card">
                  <Label htmlFor="is_active" className="font-body text-sm cursor-pointer">Ativa</Label>
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

        {/* Collections Grid */}
        {loading ? (
          <div className="liquid-glass-card p-12 rounded-2xl text-center">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-muted-foreground font-body">Carregando coleções...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="liquid-glass-card p-12 rounded-2xl text-center">
            <div className="glass-icon w-16 h-16 mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-body">Nenhuma coleção cadastrada.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="liquid-glass-card rounded-2xl overflow-hidden group"
              >
                {/* Cover Image */}
                <div className="aspect-[16/9] bg-secondary/30 relative">
                  {collection.cover_image_url ? (
                    <img
                      src={collection.cover_image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {collection.highlight_on_home && (
                      <span className="status-badge status-badge-success flex items-center gap-1">
                        <Star className="w-3 h-3" /> Destaque
                      </span>
                    )}
                    {!collection.is_active && (
                      <span className="status-badge status-badge-warning">
                        Inativa
                      </span>
                    )}
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => openEditDialog(collection)}
                      className="glass-btn-secondary"
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(collection.id)}
                      className="bg-destructive/90 hover:bg-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-display font-medium text-lg">{collection.name}</h3>
                  {collection.editorial_description && (
                    <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">
                      {collection.editorial_description}
                    </p>
                  )}
                  
                  {/* Schedule */}
                  {(collection.start_date || collection.end_date) && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground font-body">
                      <Calendar className="w-3 h-3" />
                      {collection.start_date && (
                        <span>{format(new Date(collection.start_date), 'dd/MM/yyyy')}</span>
                      )}
                      {collection.start_date && collection.end_date && <span>-</span>}
                      {collection.end_date && (
                        <span>{format(new Date(collection.end_date), 'dd/MM/yyyy')}</span>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleToggleHighlight(collection.id, collection.highlight_on_home)}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium font-body transition-all ${
                        collection.highlight_on_home
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'liquid-glass-card hover:bg-primary/10'
                      }`}
                    >
                      {collection.highlight_on_home ? 'Remover destaque' : 'Destacar'}
                    </button>
                    <button
                      onClick={() => handleToggleActive(collection.id, collection.is_active)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        collection.is_active
                          ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                          : 'liquid-glass-card text-muted-foreground'
                      }`}
                    >
                      {collection.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir Coleção"
        description="Tem certeza que deseja excluir esta coleção? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AdminLayout>
  );
};

export default Colecoes;
