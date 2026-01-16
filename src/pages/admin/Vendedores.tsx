import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, UserCheck, UserX, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Seller {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

const Vendedores = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sellers")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Erro ao carregar vendedores");
      console.error(error);
    } else {
      setSellers(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (seller?: Seller) => {
    if (seller) {
      setEditingSeller(seller);
      setName(seller.name);
      setIsActive(seller.is_active);
    } else {
      setEditingSeller(null);
      setName("");
      setIsActive(true);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);

    try {
      if (editingSeller) {
        const { error } = await supabase
          .from("sellers")
          .update({ name: name.trim(), is_active: isActive })
          .eq("id", editingSeller.id);

        if (error) throw error;
        toast.success("Vendedor atualizado");
      } else {
        const { error } = await supabase
          .from("sellers")
          .insert({ name: name.trim(), is_active: isActive });

        if (error) throw error;
        toast.success("Vendedor criado");
      }

      setDialogOpen(false);
      fetchSellers();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar vendedor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sellers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Vendedor excluído");
      fetchSellers();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir vendedor");
    }
  };

  const handleToggleActive = async (seller: Seller) => {
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ is_active: !seller.is_active })
        .eq("id", seller.id);

      if (error) throw error;
      toast.success(seller.is_active ? "Vendedor desativado" : "Vendedor ativado");
      fetchSellers();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <AdminLayout title="Vendedores">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shadow-lg shadow-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">Vendedores</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie sua equipe de vendas
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Vendedor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSeller ? "Editar Vendedor" : "Novo Vendedor"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome do Vendedor</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sellers List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : sellers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum vendedor cadastrado</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeiro vendedor
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sellers.map((seller) => (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        seller.is_active
                          ? "bg-emerald-500/10"
                          : "bg-muted"
                      }`}
                    >
                      {seller.is_active ? (
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <UserX className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{seller.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {seller.is_active ? "Ativo" : "Inativo"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(seller)}
                      title={seller.is_active ? "Desativar" : "Ativar"}
                    >
                      {seller.is_active ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(seller)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir vendedor?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O vendedor será
                            removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(seller.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AdminLayout>
  );
};

export default Vendedores;
