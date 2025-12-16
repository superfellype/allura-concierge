import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Image as ImageIcon, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPagination from "@/components/admin/AdminPagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  images: string[] | null;
}

const ITEMS_PER_PAGE = 9;

const Produtos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    original_price: "",
    category: "",
    stock_quantity: "",
    is_active: true,
    is_featured: false,
    images: [] as string[],
  });

  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar produtos");
      return;
    }

    setProducts(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price || !formData.category.trim()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const productData = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: formData.description.trim() || null,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      category: formData.category.trim(),
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      images: formData.images.length > 0 ? formData.images : null,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        toast.error("Erro ao atualizar produto");
        return;
      }
      toast.success("Produto atualizado!");
    } else {
      const { error } = await supabase.from("products").insert(productData);

      if (error) {
        toast.error("Erro ao criar produto");
        return;
      }
      toast.success("Produto criado!");
    }

    setShowModal(false);
    resetForm();
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : "",
      category: product.category,
      stock_quantity: String(product.stock_quantity),
      is_active: product.is_active,
      is_featured: product.is_featured,
      images: product.images || [],
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    const { error } = await supabase.from("products").delete().eq("id", deleteConfirm.id);

    if (error) {
      toast.error("Erro ao excluir produto");
      return;
    }

    toast.success("Produto excluído!");
    setDeleteConfirm({ open: false, id: null });
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      original_price: "",
      category: "",
      stock_quantity: "",
      is_active: true,
      is_featured: false,
      images: [],
    });
    setEditingProduct(null);
    setImageUrl("");
  };

  const addImageUrl = () => {
    if (imageUrl.trim() && !formData.images.includes(imageUrl.trim())) {
      setFormData({ ...formData, images: [...formData.images, imageUrl.trim()] });
      setImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: "Esgotado", class: "out-of-stock" };
    if (qty <= 5) return { label: `${qty} un.`, class: "low-stock" };
    return { label: `${qty} un.`, class: "bg-secondary text-secondary-foreground" };
  };

  return (
    <AdminLayout title="Produtos">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="liquid-button px-5 py-3 text-primary-foreground font-body font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </motion.button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body text-muted-foreground mt-2">Carregando...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="liquid-card text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-body text-muted-foreground">Nenhum produto encontrado</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProducts.map((product, index) => {
              const stockStatus = getStockStatus(product.stock_quantity);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="liquid-card"
                >
                  <div className="aspect-square rounded-2xl bg-secondary/50 mb-4 overflow-hidden relative">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    {product.original_price && product.original_price > product.price && (
                      <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs font-medium">
                        -{Math.round((1 - product.price / product.original_price) * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-medium truncate">{product.name}</h3>
                      <p className="font-body text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-body ${
                      product.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                    }`}>
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="font-body font-semibold text-lg">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          R$ {product.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${stockStatus.class}`}>
                      {stockStatus.label}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 py-2 glass-button rounded-xl flex items-center justify-center gap-2 font-body text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, id: product.id })}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-2xl liquid-card-strong p-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-display text-2xl font-medium mb-6">
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">Preço Original (Promoção)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="Deixe vazio se não estiver em promoção"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">Estoque *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">Categoria *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    placeholder="Ex: Bolsas, Carteiras, Acessórios"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">Imagens (URLs)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://exemplo.com/imagem.jpg"
                      className="flex-1 px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="px-4 py-3 glass-button rounded-xl font-body text-sm"
                    >
                      Adicionar
                    </button>
                  </div>
                  {formData.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`Imagem ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="font-body text-sm">Produto ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="font-body text-sm">Destaque na home</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 glass-button rounded-xl font-body font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 liquid-button rounded-xl text-primary-foreground font-body font-medium"
                >
                  {editingProduct ? "Salvar Alterações" : "Criar Produto"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation */}
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

// Add missing import
import { Package } from "lucide-react";

export default Produtos;
