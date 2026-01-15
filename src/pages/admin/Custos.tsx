import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, Search, TrendingUp, TrendingDown, Package,
  ArrowUpDown, ChevronUp, ChevronDown, Download, AlertTriangle
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToCSV } from "@/lib/export-utils";

interface ProductCost {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  price: number;
  cost_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  images: string[] | null;
}

type SortField = "name" | "price" | "cost_price" | "margin" | "stock_quantity";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 12;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function Custos() {
  const [products, setProducts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, category, price, cost_price, stock_quantity, is_active, images")
      .order("name");

    if (error) {
      toast.error("Erro ao carregar produtos");
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  const calculateMargin = (price: number, cost: number | null): number | null => {
    if (!cost || cost === 0) return null;
    return ((price - cost) / price) * 100;
  };

  const calculateProfit = (price: number, cost: number | null): number | null => {
    if (!cost) return null;
    return price - cost;
  };

  const categories = [...new Set(products.map(p => p.category))].sort();

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aVal: number | string | null = 0;
      let bVal: number | string | null = 0;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "price":
          aVal = a.price;
          bVal = b.price;
          break;
        case "cost_price":
          aVal = a.cost_price ?? 0;
          bVal = b.cost_price ?? 0;
          break;
        case "margin":
          aVal = calculateMargin(a.price, a.cost_price) ?? -Infinity;
          bVal = calculateMargin(b.price, b.cost_price) ?? -Infinity;
          break;
        case "stock_quantity":
          aVal = a.stock_quantity;
          bVal = b.stock_quantity;
          break;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      const numA = aVal as number;
      const numB = bVal as number;
      return sortDirection === "asc" ? numA - numB : numB - numA;
    });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-40" />;
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Summary stats
  const totalCost = products.reduce((acc, p) => acc + (p.cost_price || 0) * p.stock_quantity, 0);
  const totalValue = products.reduce((acc, p) => acc + p.price * p.stock_quantity, 0);
  const avgMargin = products.filter(p => p.cost_price).length > 0
    ? products.filter(p => p.cost_price).reduce((acc, p) => acc + (calculateMargin(p.price, p.cost_price) || 0), 0) / products.filter(p => p.cost_price).length
    : 0;
  const productsWithoutCost = products.filter(p => !p.cost_price).length;

  const handleExport = () => {
    const exportData = filteredProducts.map(p => ({
      Nome: p.name,
      SKU: p.sku || "",
      Categoria: p.category,
      "Preço Venda": p.price,
      "Preço Custo": p.cost_price || "",
      Margem: calculateMargin(p.price, p.cost_price)?.toFixed(1) || "",
      Lucro: calculateProfit(p.price, p.cost_price) || "",
      Estoque: p.stock_quantity,
      Status: p.is_active ? "Ativo" : "Inativo"
    }));
    exportToCSV(exportData, `custos-produtos-${new Date().toISOString().split("T")[0]}`);
    toast.success("Exportado com sucesso!");
  };

  return (
    <AdminLayout title="Custos de Produtos">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Custo Total em Estoque</span>
            </div>
            <p className="font-display text-2xl font-bold">
              R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground">Valor de Venda Estoque</span>
            </div>
            <p className="font-display text-2xl font-bold">
              R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-muted-foreground">Margem Média</span>
            </div>
            <p className="font-display text-2xl font-bold">
              {avgMargin.toFixed(1)}%
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-muted-foreground">Sem Custo Definido</span>
            </div>
            <p className="font-display text-2xl font-bold">
              {productsWithoutCost} <span className="text-sm font-normal text-muted-foreground">produtos</span>
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mb-4 opacity-50" />
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left p-4 font-medium text-muted-foreground">Produto</th>
                    <th 
                      className="text-right p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => toggleSort("price")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Preço Venda <SortIcon field="price" />
                      </div>
                    </th>
                    <th 
                      className="text-right p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => toggleSort("cost_price")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Custo <SortIcon field="cost_price" />
                      </div>
                    </th>
                    <th 
                      className="text-right p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => toggleSort("margin")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Margem <SortIcon field="margin" />
                      </div>
                    </th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Lucro Unit.</th>
                    <th 
                      className="text-right p-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => toggleSort("stock_quantity")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Estoque <SortIcon field="stock_quantity" />
                      </div>
                    </th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Custo Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product, idx) => {
                    const margin = calculateMargin(product.price, product.cost_price);
                    const profit = calculateProfit(product.price, product.cost_price);
                    const stockCost = (product.cost_price || 0) * product.stock_quantity;

                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.sku && <span className="font-mono">{product.sku}</span>}
                                {product.sku && " • "}
                                {product.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium">
                          R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 text-right">
                          {product.cost_price ? (
                            <span>R$ {product.cost_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-amber-600 text-sm">Não definido</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {margin !== null ? (
                            <span className={`inline-flex items-center gap-1 ${margin >= 30 ? "text-green-600" : margin >= 15 ? "text-amber-600" : "text-red-600"}`}>
                              {margin >= 30 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {margin.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {profit !== null ? (
                            <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                              R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className={product.stock_quantity === 0 ? "text-red-600" : ""}>
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="p-4 text-right font-medium">
                          {product.cost_price ? (
                            <span>R$ {stockCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {totalPages > 1 && (
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </motion.div>
    </AdminLayout>
  );
}
