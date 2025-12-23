import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, AlertTriangle, Package, TrendingDown, ArrowUpDown } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  images: string[] | null;
}

type SortField = "name" | "stock_quantity" | "category";
type SortOrder = "asc" | "desc";

const ITEMS_PER_PAGE = 15;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const Estoque = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("stock_quantity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [editingStock, setEditingStock] = useState<{ id: string; value: string } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, stock_quantity, is_active, images")
      .order("stock_quantity", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar estoque");
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  const updateStock = async (productId: string, newQuantity: number) => {
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: newQuantity })
      .eq("id", productId);

    if (error) {
      toast.error("Erro ao atualizar estoque");
      return;
    }

    toast.success("Estoque atualizado!");
    setEditingStock(null);
    fetchProducts();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (filter === "out") return matchesSearch && p.stock_quantity === 0;
      if (filter === "low") return matchesSearch && p.stock_quantity > 0 && p.stock_quantity <= 5;
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "stock_quantity") {
        comparison = a.stock_quantity - b.stock_quantity;
      } else if (sortField === "category") {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;

  const getStockClass = (qty: number) => {
    if (qty === 0) return "status-badge-danger";
    if (qty <= 5) return "status-badge-warning";
    return "status-badge-success";
  };

  return (
    <AdminLayout title="Estoque">
      {/* Stats - Liquid Glass */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        <motion.div variants={itemVariants} className="stats-card">
          <div className="flex items-center gap-4">
            <div className="glass-icon glass-icon-md">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-body text-sm text-muted-foreground">Total de Produtos</p>
              <p className="glass-kpi glass-kpi-md">{products.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="stats-card cursor-pointer hover:ring-2 hover:ring-amber-300/50"
          onClick={() => setFilter(filter === "low" ? "all" : "low")}
        >
          <div className="flex items-center gap-4">
            <div className="glass-icon glass-icon-md" style={{ background: 'linear-gradient(135deg, hsl(38 90% 50% / 0.15), hsl(38 90% 50% / 0.05))' }}>
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-body text-sm text-muted-foreground">Estoque Baixo</p>
              <p className="glass-kpi glass-kpi-md text-amber-600">{lowStockCount}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="stats-card cursor-pointer hover:ring-2 hover:ring-red-300/50"
          onClick={() => setFilter(filter === "out" ? "all" : "out")}
        >
          <div className="flex items-center gap-4">
            <div className="glass-icon glass-icon-md" style={{ background: 'linear-gradient(135deg, hsl(0 72% 51% / 0.15), hsl(0 72% 51% / 0.05))' }}>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-body text-sm text-muted-foreground">Sem Estoque</p>
              <p className="glass-kpi glass-kpi-md text-red-600">{outOfStockCount}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="glass-input pl-11"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className="glass-input"
        >
          <option value="all">Todos os produtos</option>
          <option value="low">Estoque baixo (≤5)</option>
          <option value="out">Sem estoque</option>
        </select>
      </div>

      {/* Products Table */}
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
          <div className="liquid-glass-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("category")}
                    >
                      <span className="flex items-center gap-1">
                        Categoria
                        <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th 
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("stock_quantity")}
                    >
                      <span className="flex items-center gap-1">
                        Estoque
                        <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium truncate max-w-[200px]">{product.name}</span>
                        </div>
                      </td>
                      <td className="text-muted-foreground">{product.category}</td>
                      <td>
                        {editingStock?.id === product.id ? (
                          <input
                            type="number"
                            min="0"
                            value={editingStock.value}
                            onChange={(e) => setEditingStock({ ...editingStock, value: e.target.value })}
                            onBlur={() => {
                              const qty = parseInt(editingStock.value);
                              if (!isNaN(qty) && qty >= 0) {
                                updateStock(product.id, qty);
                              } else {
                                setEditingStock(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const qty = parseInt(editingStock.value);
                                if (!isNaN(qty) && qty >= 0) {
                                  updateStock(product.id, qty);
                                }
                              } else if (e.key === "Escape") {
                                setEditingStock(null);
                              }
                            }}
                            autoFocus
                            className="w-20 px-2 py-1 glass-input text-sm"
                          />
                        ) : (
                          <span className={`status-badge ${getStockClass(product.stock_quantity)}`}>
                            {product.stock_quantity} un.
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${product.is_active ? 'status-badge-success' : 'status-badge-neutral'}`}>
                          {product.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setEditingStock({ id: product.id, value: String(product.stock_quantity) })}
                          className="px-3 py-1.5 glass-button rounded-lg text-sm font-body"
                        >
                          Editar
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </AdminLayout>
  );
};

export default Estoque;
