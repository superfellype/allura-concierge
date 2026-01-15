import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Save, Copy, Power, Loader2, 
  Package, Tag, DollarSign, Boxes, Truck, Image, FileText,
  AlertCircle, Check
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ImageUpload from "@/components/admin/ImageUpload";
import CategorySelect from "@/components/admin/CategorySelect";
import CollectionSelect from "@/components/admin/CollectionSelect";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { categoriesService } from "@/services/categories.service";
import { collectionsService } from "@/services/collections.service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserFriendlyError, safeLogError } from "@/lib/error-utils";
import { sanitizeSlug, validateImageUrls } from "@/lib/validation-utils";

interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  original_price: string;
  cost_price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  allow_backorder: boolean;
  weight_grams: string;
  height_cm: string;
  width_cm: string;
  length_cm: string;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  categoryIds: string[];
  collectionIds: string[];
  brand: string;
  color: string;
}

const PRODUCT_BRANDS = ['VeryRio', 'Chalita', 'LaytonVivian', 'Outro'] as const;
const PRODUCT_COLORS = [
  'Preto', 'Branco', 'Marrom', 'Caramelo', 'Nude', 'Vermelho', 
  'Azul', 'Verde', 'Rosa', 'Dourado', 'Prata', 'Outro'
];

const initialFormData: ProductFormData = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: "",
  original_price: "",
  cost_price: "",
  stock_quantity: "0",
  low_stock_threshold: "5",
  allow_backorder: false,
  weight_grams: "",
  height_cm: "",
  width_cm: "",
  length_cm: "",
  images: [],
  is_active: true,
  is_featured: false,
  categoryIds: [],
  collectionIds: [],
  brand: "Outro",
  color: "",
};

const ProdutoEditar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "novo";

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [deactivateDialog, setDeactivateDialog] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      loadProduct(id);
    }
  }, [id, isNew]);

  const loadProduct = async (productId: string) => {
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (error || !product) {
      toast.error("Produto não encontrado");
      navigate("/admin/produtos");
      return;
    }

    // Load categories
    const { data: productCategories } = await categoriesService.getProductCategories(productId);
    const categoryIds = productCategories?.map(pc => pc.category_id) || [];

    // Load collections
    const { data: productCollections } = await collectionsService.getProductCollections(productId);
    const collectionIds = productCollections?.map(pc => pc.collection_id) || [];

    setFormData({
      name: product.name,
      slug: product.slug,
      sku: product.sku || "",
      description: product.description || "",
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : "",
      cost_price: product.cost_price ? String(product.cost_price) : "",
      stock_quantity: String(product.stock_quantity),
      low_stock_threshold: product.low_stock_threshold ? String(product.low_stock_threshold) : "5",
      allow_backorder: product.allow_backorder || false,
      weight_grams: product.weight_grams ? String(product.weight_grams) : "",
      height_cm: product.height_cm ? String(product.height_cm) : "",
      width_cm: product.width_cm ? String(product.width_cm) : "",
      length_cm: product.length_cm ? String(product.length_cm) : "",
      images: product.images || [],
      is_active: product.is_active,
      is_featured: product.is_featured,
      categoryIds,
      collectionIds,
      brand: product.brand || "Outro",
      color: product.color || "",
    });

    setLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
    setHasChanges(true);
  };

  const validateSku = async (sku: string) => {
    if (!sku) {
      setSkuError(null);
      return true;
    }

    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("sku", sku.toUpperCase())
      .neq("id", id || "")
      .maybeSingle();

    if (data) {
      setSkuError("Este SKU já está em uso");
      return false;
    }

    setSkuError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const name = formData.name.trim();
    if (!name || name.length < 2) {
      toast.error("Nome do produto deve ter pelo menos 2 caracteres");
      return;
    }
    if (name.length > 200) {
      toast.error("Nome do produto deve ter no máximo 200 caracteres");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }

    // Validate SKU format if provided
    if (formData.sku) {
      const skuTrimmed = formData.sku.trim().toUpperCase();
      if (!/^[A-Z0-9-]+$/.test(skuTrimmed)) {
        toast.error("SKU deve conter apenas letras, números e hífens");
        return;
      }
      if (skuTrimmed.length > 50) {
        toast.error("SKU deve ter no máximo 50 caracteres");
        return;
      }
      const skuValid = await validateSku(formData.sku);
      if (!skuValid) {
        toast.error("SKU já existe. Use um código único.");
        return;
      }
    }

    // Validate slug format
    const slug = formData.slug || sanitizeSlug(formData.name);
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      toast.error("Slug deve conter apenas letras minúsculas, números e hífens");
      return;
    }

    // Validate image URLs
    if (formData.images.length > 0) {
      const imageValidation = validateImageUrls(formData.images);
      if (!imageValidation.valid) {
        toast.error("Uma ou mais URLs de imagem são inválidas");
        return;
      }
    }

    setSaving(true);

    // Get first category name for backward compatibility
    let categoryName = "Sem categoria";
    if (formData.categoryIds.length > 0) {
      const { data: categories } = await categoriesService.getAll();
      const firstCategory = categories?.find(c => c.id === formData.categoryIds[0]);
      categoryName = firstCategory?.name || categoryName;
    }

    const productData = {
      name: name,
      slug: slug,
      sku: formData.sku.trim().toUpperCase() || null,
      description: formData.description.trim().slice(0, 5000) || null,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      category: categoryName.slice(0, 100),
      stock_quantity: Math.max(0, parseInt(formData.stock_quantity) || 0),
      low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
      allow_backorder: formData.allow_backorder,
      weight_grams: formData.weight_grams ? parseInt(formData.weight_grams) : 0,
      height_cm: formData.height_cm ? parseFloat(formData.height_cm) : 0,
      width_cm: formData.width_cm ? parseFloat(formData.width_cm) : 0,
      length_cm: formData.length_cm ? parseFloat(formData.length_cm) : 0,
      images: formData.images.length > 0 ? formData.images.slice(0, 20) : null,
      is_active: formData.is_active,
      is_featured: formData.is_featured,
      brand: formData.brand as "VeryRio" | "Chalita" | "LaytonVivian" | "Outro",
      color: formData.color || null,
    };

    try {
      let productId = id;

      if (isNew) {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();

        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", id);

        if (error) throw error;
      }

      // Update category associations
      if (productId) {
        await categoriesService.setProductCategories(productId, formData.categoryIds);
        await collectionsService.setProductCollections(productId, formData.collectionIds);
      }

      toast.success(isNew ? "Produto criado!" : "Produto atualizado!");
      setHasChanges(false);
      
      if (isNew && productId) {
        navigate(`/admin/produtos/${productId}`);
      }
    } catch (error: unknown) {
      safeLogError("Product save", error);
      toast.error(getUserFriendlyError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (isNew) return;

    setDuplicating(true);

    try {
      // Get first category name
      let categoryName = "Sem categoria";
      if (formData.categoryIds.length > 0) {
        const { data: categories } = await categoriesService.getAll();
        const firstCategory = categories?.find(c => c.id === formData.categoryIds[0]);
        categoryName = firstCategory?.name || categoryName;
      }

      const newProduct = {
        name: `${formData.name} - Cópia`,
        slug: `${formData.slug}-copia-${Date.now()}`,
        sku: formData.sku ? `${formData.sku}-COPY` : null,
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        category: categoryName,
        stock_quantity: 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        allow_backorder: formData.allow_backorder,
        weight_grams: formData.weight_grams ? parseInt(formData.weight_grams) : 0,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : 0,
        width_cm: formData.width_cm ? parseFloat(formData.width_cm) : 0,
        length_cm: formData.length_cm ? parseFloat(formData.length_cm) : 0,
        images: formData.images,
        is_active: false,
        is_featured: false,
        brand: formData.brand as "VeryRio" | "Chalita" | "LaytonVivian" | "Outro",
        color: formData.color || null,
      };

      const { data, error } = await supabase
        .from("products")
        .insert(newProduct)
        .select("id")
        .single();

      if (error) throw error;

      // Copy category and collection associations
      if (data.id) {
        await categoriesService.setProductCategories(data.id, formData.categoryIds);
        await collectionsService.setProductCollections(data.id, formData.collectionIds);
      }

      toast.success("Produto duplicado!");
      navigate(`/admin/produtos/${data.id}`);
    } catch (error: unknown) {
      safeLogError("Product duplicate", error);
      toast.error(getUserFriendlyError(error));
    } finally {
      setDuplicating(false);
    }
  };

  const handleToggleActive = async () => {
    if (isNew) return;

    const newStatus = !formData.is_active;
    
    const { error } = await supabase
      .from("products")
      .update({ is_active: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao alterar status");
      return;
    }

    setFormData(prev => ({ ...prev, is_active: newStatus }));
    toast.success(newStatus ? "Produto ativado!" : "Produto desativado!");
    setDeactivateDialog(false);
  };

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <AdminLayout title="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isNew ? "Novo Produto" : "Editar Produto"}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/produtos")}
              className="p-2 hover:bg-secondary rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-medium">
                {isNew ? "Novo Produto" : formData.name || "Editar Produto"}
              </h1>
              {!isNew && formData.sku && (
                <p className="font-mono text-sm text-muted-foreground">SKU: {formData.sku}</p>
              )}
            </div>
            {!isNew && (
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                formData.is_active 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {formData.is_active ? 'Ativo' : 'Inativo'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isNew && (
              <>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="flex items-center gap-2 px-4 py-2 glass-button rounded-xl font-body text-sm disabled:opacity-50"
                >
                  {duplicating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Duplicar
                </button>
                <button
                  type="button"
                  onClick={() => formData.is_active ? setDeactivateDialog(true) : handleToggleActive()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm transition-colors ${
                    formData.is_active 
                      ? 'text-destructive hover:bg-destructive/10' 
                      : 'text-green-600 hover:bg-green-100'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {formData.is_active ? 'Desativar' : 'Ativar'}
                </button>
              </>
            )}
            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-2 liquid-button rounded-xl text-primary-foreground font-body font-medium disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </motion.button>
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="liquid-glass p-1 rounded-xl w-full flex-wrap h-auto gap-1">
            <TabsTrigger value="identity" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Identidade</span>
            </TabsTrigger>
            <TabsTrigger value="categorization" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Categorização</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Preços</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Boxes className="w-4 h-4" />
              <span className="hidden sm:inline">Estoque</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Frete</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Imagens</span>
            </TabsTrigger>
            <TabsTrigger value="description" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Descrição</span>
            </TabsTrigger>
          </TabsList>

          {/* Identity Tab */}
          <TabsContent value="identity">
            <div className="liquid-card space-y-6">
              <h3 className="font-display text-lg font-medium flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Identidade do Produto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder="Ex: Bolsa Tote em Couro Premium"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    SKU (Código Único) *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => {
                      updateField('sku', e.target.value.toUpperCase());
                      setSkuError(null);
                    }}
                    onBlur={(e) => validateSku(e.target.value)}
                    placeholder="Ex: BOLSA-TOTE-001"
                    className={`w-full px-4 py-3 liquid-glass rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase ${
                      skuError ? 'ring-2 ring-destructive/50' : ''
                    }`}
                  />
                  {skuError && (
                    <p className="flex items-center gap-1 text-destructive text-xs mt-1">
                      <AlertCircle className="w-3 h-3" />
                      {skuError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Código único para identificar o produto no estoque
                  </p>
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="bolsa-tote-couro-premium"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: /produto/{formData.slug || 'slug-do-produto'}
                  </p>
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Marca
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {PRODUCT_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Cor
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) => updateField('color', e.target.value)}
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecione...</option>
                    {PRODUCT_COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => updateField('is_active', e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="font-body text-sm">Produto ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => updateField('is_featured', e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="font-body text-sm">Destaque na home</span>
                </label>
              </div>
            </div>
          </TabsContent>

          {/* Categorization Tab */}
          <TabsContent value="categorization">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="liquid-card space-y-4">
                <h3 className="font-display text-lg font-medium flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Categorias
                </h3>
                <CategorySelect
                  selectedIds={formData.categoryIds}
                  onChange={(ids) => updateField('categoryIds', ids)}
                />
              </div>

              <div className="liquid-card space-y-4">
                <h3 className="font-display text-lg font-medium flex items-center gap-2">
                  <Tag className="w-5 h-5 text-accent" />
                  Coleções
                </h3>
                <CollectionSelect
                  selectedIds={formData.collectionIds}
                  onChange={(ids) => updateField('collectionIds', ids)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <div className="liquid-card space-y-6">
              <h3 className="font-display text-lg font-medium flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Preços
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    required
                    placeholder="0,00"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Preço Original (Promoção)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_price}
                    onChange={(e) => updateField('original_price', e.target.value)}
                    placeholder="Deixe vazio se não houver"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se preenchido, mostra como preço riscado
                  </p>
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Custo (Admin)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => updateField('cost_price', e.target.value)}
                    placeholder="Custo do produto"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Visível apenas para administradores
                  </p>
                </div>
              </div>

              {formData.price && formData.cost_price && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-body text-sm">
                    <span className="text-muted-foreground">Margem de lucro:</span>{' '}
                    <span className="font-semibold">
                      {((1 - parseFloat(formData.cost_price) / parseFloat(formData.price)) * 100).toFixed(1)}%
                    </span>
                    {' '}
                    <span className="text-muted-foreground">
                      (R$ {(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)})
                    </span>
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <div className="liquid-card space-y-6">
              <h3 className="font-display text-lg font-medium flex items-center gap-2">
                <Boxes className="w-5 h-5 text-primary" />
                Estoque
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Quantidade em Estoque *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => updateField('stock_quantity', e.target.value)}
                    required
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Alerta de Estoque Baixo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => updateField('low_stock_threshold', e.target.value)}
                    placeholder="5"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Notifica quando estoque atingir este valor
                  </p>
                </div>

                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_backorder}
                      onChange={(e) => updateField('allow_backorder', e.target.checked)}
                      className="w-4 h-4 rounded border-border accent-primary"
                    />
                    <span className="font-body text-sm">Permitir pré-venda</span>
                  </label>
                </div>
              </div>

              {/* Stock Status Badge */}
              <div className="p-4 rounded-xl bg-secondary/50">
                {parseInt(formData.stock_quantity) === 0 ? (
                  <p className="flex items-center gap-2 text-destructive font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Produto sem estoque
                  </p>
                ) : parseInt(formData.stock_quantity) <= parseInt(formData.low_stock_threshold) ? (
                  <p className="flex items-center gap-2 text-amber-600 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Estoque baixo ({formData.stock_quantity} unidades)
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-green-600 font-medium">
                    <Check className="w-4 h-4" />
                    Estoque OK ({formData.stock_quantity} unidades)
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Shipping Tab */}
          <TabsContent value="shipping">
            <div className="liquid-card space-y-6">
              <h3 className="font-display text-lg font-medium flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                Dimensões para Frete
              </h3>
              <p className="text-sm text-muted-foreground -mt-4">
                Preencha para cálculo automático de frete via Correios
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Peso (gramas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.weight_grams}
                    onChange={(e) => updateField('weight_grams', e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.height_cm}
                    onChange={(e) => updateField('height_cm', e.target.value)}
                    placeholder="Ex: 20"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Largura (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.width_cm}
                    onChange={(e) => updateField('width_cm', e.target.value)}
                    placeholder="Ex: 30"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                    Comprimento (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.length_cm}
                    onChange={(e) => updateField('length_cm', e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Volume calculation */}
              {formData.height_cm && formData.width_cm && formData.length_cm && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-body text-sm">
                    <span className="text-muted-foreground">Volume:</span>{' '}
                    <span className="font-semibold">
                      {(parseFloat(formData.height_cm) * parseFloat(formData.width_cm) * parseFloat(formData.length_cm) / 1000).toFixed(2)} litros
                    </span>
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <div className="liquid-card space-y-6">
              <h3 className="font-display text-lg font-medium flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Imagens do Produto
              </h3>

              <ImageUpload
                images={formData.images}
                onChange={(images) => updateField('images', images)}
                productId={isNew ? undefined : id}
              />
            </div>
          </TabsContent>

          {/* Description Tab */}
          <TabsContent value="description">
            <div className="liquid-card space-y-6">
              <h3 className="font-display text-lg font-medium flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Descrição
              </h3>

              <div>
                <label className="font-body text-sm text-foreground/70 mb-1.5 block">
                  Descrição do Produto
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={8}
                  placeholder="Descreva o produto com detalhes: materiais, dimensões, diferenciais..."
                  className="w-full px-4 py-3 liquid-glass rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length} caracteres
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      {/* Deactivate Dialog */}
      <ConfirmDialog
        open={deactivateDialog}
        onOpenChange={setDeactivateDialog}
        title="Desativar Produto"
        description="O produto ficará invisível para clientes mas permanecerá no sistema. Você pode reativá-lo a qualquer momento."
        confirmText="Desativar"
        onConfirm={handleToggleActive}
        variant="destructive"
      />
    </AdminLayout>
  );
};

export default ProdutoEditar;
