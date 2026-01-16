import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Save, Loader2, Package, Tag, Sparkles, 
  ImageIcon, Eye, EyeOff, Star, StarOff, Check, X
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ImageUpload from "@/components/admin/ImageUpload";
import CategorySelect from "@/components/admin/CategorySelect";
import BrandSelect from "@/components/admin/BrandSelect";
import { supabase } from "@/integrations/supabase/client";
import { categoriesService } from "@/services/categories.service";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeSlug } from "@/lib/validation-utils";

async function ensureUniqueSlug(base: string) {
  const cleanBase = (base || "").trim() || `produto-${Date.now()}`;

  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = attempt === 0 ? cleanBase : `${cleanBase}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) return `${cleanBase}-${Date.now()}`;
    if (!data) return candidate;
  }

  return `${cleanBase}-${Date.now()}`;
}


export default function ProdutoNovo() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [saving, setSaving] = useState(false);

  const priceNum = Number(price) || 0;
  const originalPriceNum = Number(originalPrice) || 0;
  const stockNum = Math.max(0, Math.floor(Number(stock) || 0));

  const discount = originalPriceNum > priceNum && priceNum > 0 
    ? Math.round((1 - priceNum / originalPriceNum) * 100) 
    : 0;

  const canSave = useMemo(() => {
    return name.trim().length >= 2 && priceNum > 0 && stockNum >= 0;
  }, [name, priceNum, stockNum]);

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Preencha nome, preço e estoque corretamente");
      return;
    }

    setSaving(true);
    try {
      let categoryName = "Sem categoria";
      if (categoryIds.length > 0) {
        const { data: cats } = await categoriesService.getAll();
        const first = cats?.find((c) => c.id === categoryIds[0]);
        categoryName = first?.name || categoryName;
      }

      const baseSlug = sanitizeSlug(name);
      const slug = await ensureUniqueSlug(baseSlug);

      const payload: {
        name: string;
        slug: string;
        sku: string | null;
        brand: "VeryRio" | "Chalita" | "LaytonVivian" | "Outro" | null;
        price: number;
        original_price: number | null;
        category: string;
        description: string | null;
        stock_quantity: number;
        images: string[] | null;
        is_active: boolean;
        is_featured: boolean;
      } = {
        name: name.trim(),
        slug,
        sku: sku.trim() ? sku.trim().toUpperCase() : null,
        brand: (brand as "VeryRio" | "Chalita" | "LaytonVivian" | "Outro") || null,
        price: priceNum,
        original_price: originalPriceNum > 0 ? originalPriceNum : null,
        category: categoryName,
        description: description.trim() || null,
        stock_quantity: stockNum,
        images: images.length ? images.slice(0, 20) : null,
        is_active: isActive,
        is_featured: isFeatured,
      };

      const { data: created, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      if (created?.id) {
        await categoriesService.setProductCategories(created.id, categoryIds);
      }

      toast.success("Produto criado com sucesso!");
      navigate(created?.id ? `/admin/produtos/${created.id}` : "/admin/produtos");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar produto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Novo Produto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/produtos")}
              className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Novo Produto
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cadastre um novo item no catálogo
              </p>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={handleSave} 
              disabled={!canSave || saving} 
              size="lg"
              className="h-11 px-6 gap-2 shadow-lg shadow-primary/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Criar Produto
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Informações Básicas</h2>
                    <p className="text-xs text-muted-foreground">Nome, código e marca</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome do produto <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="name"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Ex: Bolsa Tote Couro Premium"
                    className="h-11"
                  />
                  {name.length > 0 && name.length < 2 && (
                    <p className="text-xs text-destructive">Mínimo 2 caracteres</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-sm font-medium">
                      SKU / Código
                    </Label>
                    <Input 
                      id="sku"
                      value={sku} 
                      onChange={(e) => setSku(e.target.value.toUpperCase())} 
                      placeholder="Ex: ALR-001"
                      className="h-11 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-sm font-medium">Marca</Label>
                    <BrandSelect value={brand} onChange={setBrand} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Categories Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/30 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Categorias</h2>
                    <p className="text-xs text-muted-foreground">Organize o catálogo</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <CategorySelect selectedIds={categoryIds} onChange={setCategoryIds} />
              </div>
            </motion.div>

            {/* Pricing Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-emerald-600 font-bold text-sm">R$</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Preço e Estoque</h2>
                    <p className="text-xs text-muted-foreground">Valores e disponibilidade</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">
                      Preço <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                      <Input 
                        id="price"
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        placeholder="0,00"
                        className="h-11 pl-10 text-lg font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="originalPrice" className="text-sm font-medium">
                      Preço original
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                      <Input 
                        id="originalPrice"
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={originalPrice} 
                        onChange={(e) => setOriginalPrice(e.target.value)} 
                        placeholder="0,00"
                        className="h-11 pl-10"
                      />
                    </div>
                    {discount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        {discount}% desconto
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-sm font-medium">
                      Estoque <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="stock"
                      type="number" 
                      step="1" 
                      min="0"
                      value={stock} 
                      onChange={(e) => setStock(e.target.value)} 
                      className="h-11 text-center text-lg font-semibold"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      {stockNum === 0 ? 'Esgotado' : `${stockNum} un. disponíveis`}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Images Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Galeria de Imagens</h2>
                    <p className="text-xs text-muted-foreground">
                      {images.length > 0 ? `${images.length} imagens • Arraste para reordenar` : 'Adicione até 20 imagens'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <ImageUpload images={images} onChange={setImages} />
              </div>
            </motion.div>

            {/* Description Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">Aa</span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Descrição</h2>
                      <p className="text-xs text-muted-foreground">Detalhes, materiais, medidas</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {description.length}/5000
                  </span>
                </div>
              </div>

              <div className="p-6">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                  placeholder="Descreva o produto em detalhes: materiais utilizados, dimensões, instruções de cuidado, diferenciais..."
                  className="min-h-[160px] resize-none"
                />
              </div>
            </motion.div>
          </div>

          {/* Right Column - Preview & Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card border border-border rounded-2xl overflow-hidden sticky top-6"
            >
              <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-foreground">Preview ao vivo</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Como aparece na loja</span>
                </div>
              </div>

              <div className="p-5">
                {/* Product Card Preview */}
                <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
                  {/* Image */}
                  <div className="aspect-square bg-secondary/30 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {images.length > 0 ? (
                        <motion.img
                          key={images[0]}
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          src={images[0]}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <div className="text-center text-muted-foreground">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">Sem imagem</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {discount > 0 && (
                        <span className="px-2 py-1 rounded-md bg-destructive text-destructive-foreground text-xs font-semibold shadow-lg">
                          -{discount}%
                        </span>
                      )}
                      {isFeatured && (
                        <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-semibold shadow-lg flex items-center gap-1">
                          <Star className="w-3 h-3" /> Destaque
                        </span>
                      )}
                    </div>

                    {!isActive && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                          Produto inativo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{brand}</p>
                        <h3 className="font-display font-semibold text-foreground truncate">
                          {name || "Nome do produto"}
                        </h3>
                        {sku && (
                          <p className="text-xs text-muted-foreground font-mono">#{sku}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">
                        {priceNum > 0 ? `R$ ${priceNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ --'}
                      </span>
                      {originalPriceNum > priceNum && priceNum > 0 && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {originalPriceNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        stockNum === 0 
                          ? 'bg-destructive/10 text-destructive' 
                          : stockNum <= 5 
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {stockNum === 0 ? 'Esgotado' : `${stockNum} em estoque`}
                      </span>
                      <Button size="sm" disabled={stockNum === 0} className="h-8 text-xs">
                        Comprar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Settings */}
              <div className="px-5 pb-5 space-y-3">
                <div className="h-px bg-border" />
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Visibilidade</p>
                      <p className="text-xs text-muted-foreground">
                        {isActive ? 'Visível na loja' : 'Oculto da loja'}
                      </p>
                    </div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    {isFeatured ? (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <StarOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Destaque</p>
                      <p className="text-xs text-muted-foreground">
                        {isFeatured ? 'Aparece em destaque' : 'Produto comum'}
                      </p>
                    </div>
                  </div>
                  <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
              </div>

              {/* Validation Summary */}
              <div className="px-5 pb-5">
                <div className={`p-4 rounded-xl border-2 ${
                  canSave 
                    ? 'border-emerald-200 bg-emerald-50' 
                    : 'border-amber-200 bg-amber-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {canSave ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <X className="w-4 h-4 text-amber-600" />
                    )}
                    <span className={`text-sm font-medium ${canSave ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {canSave ? 'Pronto para salvar' : 'Campos obrigatórios'}
                    </span>
                  </div>
                  {!canSave && (
                    <ul className="text-xs text-amber-600 space-y-1 ml-6">
                      {name.trim().length < 2 && <li>• Nome (mín. 2 caracteres)</li>}
                      {priceNum <= 0 && <li>• Preço válido</li>}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
