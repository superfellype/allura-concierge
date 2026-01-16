import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, GripVertical, Edit2, Check, X, Loader2, Tag } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { brandsService, Brand } from "@/services/brands.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function Marcas() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBrandName, setNewBrandName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    const { data } = await brandsService.getAll();
    setBrands(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleCreate = async () => {
    if (!newBrandName.trim()) {
      toast.error("Nome obrigatório");
      return;
    }

    setCreating(true);
    const { error } = await brandsService.create({ 
      name: newBrandName.trim(),
      display_order: brands.length 
    });

    if (error) {
      toast.error("Erro ao criar marca");
    } else {
      toast.success("Marca criada!");
      setNewBrandName("");
      fetchBrands();
    }
    setCreating(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) {
      toast.error("Nome obrigatório");
      return;
    }

    const { error } = await brandsService.update(id, { name: editingName.trim() });
    if (error) {
      toast.error("Erro ao atualizar");
    } else {
      toast.success("Marca atualizada!");
      setEditingId(null);
      fetchBrands();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await brandsService.delete(deleteId);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Marca excluída!");
      fetchBrands();
    }
    setDeleteId(null);
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await brandsService.toggleActive(id, isActive);
    if (error) {
      toast.error("Erro ao alterar status");
    } else {
      fetchBrands();
    }
  };

  const startEditing = (brand: Brand) => {
    setEditingId(brand.id);
    setEditingName(brand.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <AdminLayout title="Marcas">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Tag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Marcas</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie as marcas disponíveis para os produtos
            </p>
          </div>
        </motion.div>

        {/* Add New Brand */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Adicionar marca
          </h2>
          <div className="flex gap-3">
            <Input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Nome da nova marca..."
              className="flex-1 h-11"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={creating} className="h-11 px-5">
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Brands List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border bg-secondary/30">
            <h2 className="font-semibold">
              Marcas cadastradas
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({brands.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nenhuma marca cadastrada</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence>
                {brands.map((brand, index) => (
                  <motion.div
                    key={brand.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="text-muted-foreground cursor-grab hover:text-foreground transition-colors">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {editingId === brand.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-9 flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(brand.id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                        />
                        <Button size="icon" variant="ghost" onClick={() => handleUpdate(brand.id)} className="h-9 w-9 text-emerald-600">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-9 w-9">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {brand.logo_url && (
                              <img src={brand.logo_url} alt="" className="w-6 h-6 rounded object-cover" />
                            )}
                            <span className={`font-medium ${!brand.is_active ? 'text-muted-foreground line-through' : ''}`}>
                              {brand.name}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            /{brand.slug}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={brand.is_active}
                            onCheckedChange={(checked) => handleToggleActive(brand.id, checked)}
                          />
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditing(brand)}
                            className="h-9 w-9"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(brand.id)}
                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir marca"
        description="Tem certeza que deseja excluir esta marca? Produtos com esta marca serão mantidos."
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AdminLayout>
  );
}
