import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Package, Weight, Ruler, AlertTriangle, Percent } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { NumericFormat } from "react-number-format";
import { pricingService, type MassDiscountPreview } from "@/services/pricing.service";
import { isPriceBelowCost } from "@/lib/price-utils";
interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  cost_price: number | null;
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
  brand: string | null;
  color: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ITEMS_PER_PAGE = 9;

const Produtos = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  
  // Mass discount modal (Spec 3.2) - Uses isolated pricing service
  const [massDiscountOpen, setMassDiscountOpen] = useState(false);
  const [massDiscountPercent, setMassDiscountPercent] = useState<number>(0);
  const [massDiscountPreview, setMassDiscountPreview] = useState<MassDiscountPreview[]>([]);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, price, original_price, cost_price, category, stock_quantity, is_active, images, sku, low_stock_threshold, weight_grams, height_cm, width_cm, length_cm, brand, color")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar produtos"); return; }
    setProducts(data || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name");
    setCategories(data || []);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteConfirm.id);
    if (error) { toast.error("Erro ao excluir produto"); return; }
    toast.success("Produto excluído!");
    setDeleteConfirm({ open: false, id: null });
    fetchProducts();
  };

  // Get unique brands and colors from products
  const uniqueBrands = useMemo(() => {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return brands.sort();
  }, [products]);

  const uniqueColors = useMemo(() => {
    const colors = [...new Set(products.map(p => p.color).filter(Boolean))];
    return colors.sort();
  }, [products]);

  // Filter products with normalized comparison
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = !searchLower || 
        p.name.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        (p.sku && p.sku.toLowerCase().includes(searchLower));
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "inactive" && !p.is_active);
      
      // Normalized category comparison (case-insensitive, trimmed)
      const normalizedCategoryFilter = categoryFilter.toLowerCase().trim();
      const normalizedProductCategory = p.category.toLowerCase().trim();
      const matchesCategory = categoryFilter === "all" || 
        normalizedProductCategory === normalizedCategoryFilter ||
        normalizedProductCategory.includes(normalizedCategoryFilter);
      
      const matchesBrand = brandFilter === "all" || p.brand === brandFilter;
      const matchesColor = colorFilter === "all" || p.color === colorFilter;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesBrand && matchesColor;
    });
  }, [products, searchQuery, statusFilter, categoryFilter, brandFilter, colorFilter]);
  
  // Stats (Spec 2.4)
  const activeCount = products.filter(p => p.is_active).length;
  const inactiveCount = products.filter(p => !p.is_active).length;
  
  // Stats by category - memoized with explicit dependency
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    const activeProducts = products.filter(p => p.is_active);
    activeProducts.forEach(p => {
      // Normalize category name for consistent stats
      const cat = (p.category || "Sem categoria").trim();
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  }, [products]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStockStatus = (qty: number, threshold: number | null) => {
    const t = threshold || 5;
    if (qty === 0) return { label: "Esgotado", class: "status-badge-danger" };
    if (qty <= t) return { label: `${qty} un.`, class: "status-badge-warning" };
    return { label: `${qty} un.`, class: "status-badge-neutral" };
  };

  // Mass discount preview using pricing service (Spec 3.2)
  const handleMassDiscountPreview = useCallback((percent: number) => {
    setMassDiscountPercent(percent);
    
    const validation = pricingService.validateDiscountPercent(percent);
    if (!validation.valid) {
      setMassDiscountPreview([]);
      return;
    }
    
    const preview = pricingService.calculateMassDiscountPreview(products, percent, 10);
    setMassDiscountPreview(preview);
  }, [products]);

  // Apply mass discount using isolated pricing service
  const handleApplyMassDiscount = useCallback(async () => {
    const validation = pricingService.validateDiscountPercent(massDiscountPercent);
    if (!validation.valid) {
      toast.error(validation.error || "Percentual inválido");
      return;
    }
    
    setApplyingDiscount(true);
    
    try {
      const result = await pricingService.applyMassDiscount(products, massDiscountPercent);
      
      if (result.success) {
        toast.success(`Desconto de ${massDiscountPercent}% aplicado a ${result.updatedCount} produtos!`);
        
        if (result.belowCostWarnings.length > 0) {
          toast.warning(`${result.belowCostWarnings.length} produto(s) ficaram abaixo do custo`);
        }
        
        setMassDiscountOpen(false);
        setMassDiscountPercent(0);
        setMassDiscountPreview([]);
        fetchProducts();
      } else {
        toast.error(`Erros ao aplicar desconto: ${result.errors.slice(0, 3).join(', ')}`);
      }
    } catch (error) {
      toast.error("Erro inesperado ao aplicar desconto");
    } finally {
      setApplyingDiscount(false);
    }
  }, [products, massDiscountPercent]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setBrandFilter("all");
    setColorFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || categoryFilter !== "all" || brandFilter !== "all" || colorFilter !== "all";

  return (
    <AdminLayout title="Produtos">
      {/* Stats bar - Spec 2.4 */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <span className="text-muted-foreground">
          Total: <strong>{products.length}</strong>
        </span>
        <span className="text-emerald-600">
          Ativos: <strong>{activeCount}</strong>
        </span>
        <span className="text-muted-foreground">
          Inativos: <strong>{inactiveCount}</strong>
        </span>
        <span className="mx-2 text-border">|</span>
        {Object.entries(categoryStats).slice(0, 5).map(([cat, count]) => (
          <span key={cat} className="text-muted-foreground">
            {cat}: <strong>{count}</strong>
          </span>
        ))}
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nome, categoria ou SKU..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="glass-input pl-11 w-full" 
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }} 
            onClick={() => navigate("/admin/produtos/novo")}
            className="glass-btn flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </motion.button>
          <Button
            variant="outline"
            onClick={() => setMassDiscountOpen(true)}
            className="gap-2"
          >
            <Percent className="w-4 h-4" />
            Desconto em Massa
          </Button>
        </div>
        
        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
            className="glass-input w-auto min-w-[120px] text-sm"
          >
            <option value="all">Status: Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="glass-input w-auto min-w-[140px] text-sm"
          >
            <option value="all">Categoria: Todas</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          
          <select
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }}
            className="glass-input w-auto min-w-[120px] text-sm"
          >
            <option value="all">Marca: Todas</option>
            {uniqueBrands.map(brand => (
              <option key={brand} value={brand!}>{brand}</option>
            ))}
          </select>
          
          <select
            value={colorFilter}
            onChange={(e) => { setColorFilter(e.target.value); setCurrentPage(1); }}
            className="glass-input w-auto min-w-[120px] text-sm"
          >
            <option value="all">Cor: Todas</option>
            {uniqueColors.map(color => (
              <option key={color} value={color!}>{color}</option>
            ))}
          </select>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Limpar filtros
            </Button>
          )}
        </div>
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
              const belowCost = isPriceBelowCost(product.price, product.cost_price);
              
              return (
                <motion.div 
                  key={product.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }} 
                  className={`liquid-glass-card p-5 ${belowCost ? 'ring-2 ring-amber-500/50' : ''}`}
                >
                  {/* Price below cost alert - Spec 3.3 */}
                  {belowCost && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-amber-500/10 text-amber-700 text-xs">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Preço abaixo do custo!</span>
                    </div>
                  )}
                  
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
                      {product.brand && <p className="font-body text-xs text-muted-foreground">{product.brand}</p>}
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
                      {/* Show cost for admins */}
                      {product.cost_price && (
                        <p className={`text-xs ${belowCost ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          Custo: R$ {product.cost_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
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

      {/* Delete Confirm Dialog */}
      <ConfirmDialog 
        open={deleteConfirm.open} 
        onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
        title="Excluir Produto" 
        description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        confirmText="Excluir" 
        onConfirm={handleDelete} 
        variant="destructive" 
      />

      {/* Mass Discount Dialog - Spec 3.2 */}
      <Dialog open={massDiscountOpen} onOpenChange={setMassDiscountOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary" />
              Aplicar Desconto em Massa
            </DialogTitle>
            <DialogDescription>
              Aplique um percentual de desconto a todos os produtos ativos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="discount-percent">Percentual de Desconto (%)</Label>
              <NumericFormat
                id="discount-percent"
                value={massDiscountPercent}
                onValueChange={(values) => handleMassDiscountPreview(values.floatValue || 0)}
                decimalScale={0}
                allowNegative={false}
                suffix="%"
                className="mt-1.5 w-full px-3 py-2 glass-input rounded-md"
                placeholder="Ex: 10%"
              />
            </div>
            
            {massDiscountPreview.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm font-medium mb-3">Preview (primeiros 10 produtos):</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {massDiscountPreview.map((item, i) => (
                    <div key={i} className={`flex justify-between text-sm ${item.belowCost ? 'text-amber-600' : ''}`}>
                      <span className="truncate flex-1">{item.name}</span>
                      <span className="flex items-center gap-2 ml-2">
                        <span className="text-muted-foreground line-through">
                          R$ {item.oldPrice.toFixed(2)}
                        </span>
                        <span className="font-medium">
                          R$ {item.newPrice.toFixed(2)}
                        </span>
                        {item.belowCost && <AlertTriangle className="w-3 h-3" />}
                      </span>
                    </div>
                  ))}
                </div>
                {massDiscountPreview.some(p => p.belowCost) && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Alguns produtos ficarão abaixo do custo!
                  </p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMassDiscountOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApplyMassDiscount}
              disabled={massDiscountPercent <= 0 || massDiscountPercent > 100 || applyingDiscount}
            >
              {applyingDiscount ? 'Aplicando...' : `Aplicar a ${products.filter(p => p.is_active).length} produtos`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Produtos;
