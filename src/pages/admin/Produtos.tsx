import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Package, Weight, Ruler } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  images: string[] | null;
  sku: string | null;
  low_stock_threshold: number | null;
  weight_grams: number | null;
  height_cm: number | null;
  width_cm: number | null;
  length_cm: number | null;
}

const ITEMS_PER_PAGE = 9;

const Produtos = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all"); // Spec 2.2
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar produtos"); return; }
    setProducts(data || []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteConfirm.id);
    if (error) { toast.error("Erro ao excluir produto"); return; }
    toast.success("Produto excluído!");
    setDeleteConfirm({ open: false, id: null });
    fetchProducts();
  };

  // Filter by search query AND status (Spec 2.2)
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && p.is_active) ||
      (statusFilter === "inactive" && !p.is_active);
    
    return matchesSearch && matchesStatus;
  });
  
  // Count active products (Spec 2.4)
  const activeCount = products.filter(p => p.is_active).length;
  const inactiveCount = products.filter(p => !p.is_active).length;

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStockStatus = (qty: number, threshold: number | null) => {
    const t = threshold || 5;
    if (qty === 0) return { label: "Esgotado", class: "status-badge-danger" };
    if (qty <= t) return { label: `${qty} un.`, class: "status-badge-warning" };
    return { label: `${qty} un.`, class: "status-badge-neutral" };
  };

  return (
    <AdminLayout title="Produtos">
      {/* Stats bar - Spec 2.4 */}
      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-muted-foreground">
          Total: <strong>{products.length}</strong>
        </span>
        <span className="text-emerald-600">
          Ativos: <strong>{activeCount}</strong>
        </span>
        <span className="text-muted-foreground">
          Inativos: <strong>{inactiveCount}</strong>
        </span>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por nome, categoria ou SKU..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="glass-input pl-11" 
          />
        </div>
        {/* Status filter - Spec 2.2 */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
          className="glass-input w-auto min-w-[140px]"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }} 
          onClick={() => navigate("/admin/produtos/novo")}
          className="glass-btn flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </motion.button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-muted-foreground mt-2">Carregando...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-body text-muted-foreground">Nenhum produto encontrado</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedProducts.map((product, index) => {
              const stockStatus = getStockStatus(product.stock_quantity, product.low_stock_threshold);
              return (
                <motion.div 
                  key={product.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }} 
                  className="liquid-glass-card p-5"
                >
                  <div className="aspect-square rounded-2xl bg-secondary/30 mb-4 overflow-hidden relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    {product.original_price && product.original_price > product.price && (
                      <span className="absolute top-3 left-3 status-badge status-badge-danger">
                        -{Math.round((1 - product.price / product.original_price) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-medium truncate">{product.name}</h3>
                      <p className="font-body text-sm text-muted-foreground">{product.category}</p>
                      {product.sku && <p className="font-mono text-xs text-muted-foreground">SKU: {product.sku}</p>}
                    </div>
                    <span className={`ml-2 status-badge ${product.is_active ? 'status-badge-success' : 'status-badge-neutral'}`}>
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="font-body font-semibold text-lg">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="ml-2 text-sm text-muted-foreground line-through">R$ {product.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      )}
                    </div>
                    <span className={`status-badge ${stockStatus.class}`}>{stockStatus.label}</span>
                  </div>
                  {product.weight_grams != null && product.weight_grams > 0 && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <Weight className="w-3 h-3" /><span>{product.weight_grams}g</span>
                      {product.height_cm != null && product.width_cm != null && product.length_cm != null && 
                       product.height_cm > 0 && product.width_cm > 0 && product.length_cm > 0 && (
                        <><Ruler className="w-3 h-3 ml-2" /><span>{product.height_cm}×{product.width_cm}×{product.length_cm}cm</span></>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/admin/produtos/${product.id}`)}
                      className="flex-1 py-2.5 glass-button rounded-xl flex items-center justify-center gap-2 font-body text-sm"
                    >
                      <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ open: true, id: product.id })}
                      className="p-2.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      <ConfirmDialog 
        open={deleteConfirm.open} 
        onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
        title="Excluir Produto" 
        description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmText="Excluir" 
        onConfirm={handleDelete} 
        variant="destructive" 
      />
    </AdminLayout>
  );
};

export default Produtos;
