import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2, Package, DollarSign, Boxes, Image as ImageIcon, FileText } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ImageUpload from "@/components/admin/ImageUpload";
import CategorySelect from "@/components/admin/CategorySelect";
import { supabase } from "@/integrations/supabase/client";
import { categoriesService } from "@/services/categories.service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { sanitizeSlug } from "@/lib/validation-utils";

type ProductBrand = "VeryRio" | "Chalita" | "LaytonVivian" | "Outro";

const PRODUCT_BRANDS: { id: ProductBrand; label: string }[] = [
  { id: "VeryRio", label: "VeryRio" },
  { id: "Chalita", label: "Chalita" },
  { id: "LaytonVivian", label: "Layton Vivian" },
  { id: "Outro", label: "Outro" },
];

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
  const [brand, setBrand] = useState<ProductBrand>("Outro");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    const p = Number(price);
    const s = Number(stock);
    return name.trim().length >= 2 && Number.isFinite(p) && p > 0 && Number.isFinite(s) && s >= 0;
  }, [name, price, stock]);

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Preencha nome, preço e estoque corretamente");
      return;
    }

    setSaving(true);
    try {
      // Category string legacy field
      let categoryName = "Sem categoria";
      if (categoryIds.length > 0) {
        const { data: cats } = await categoriesService.getAll();
        const first = cats?.find((c) => c.id === categoryIds[0]);
        categoryName = first?.name || categoryName;
      }

      const baseSlug = sanitizeSlug(name);
      const slug = await ensureUniqueSlug(baseSlug);

      const payload = {
        name: name.trim(),
        slug,
        sku: sku.trim() ? sku.trim().toUpperCase() : null,
        brand,
        price: Number(price),
        original_price: originalPrice.trim() ? Number(originalPrice) : null,
        category: categoryName,
        description: description.trim() ? description.trim() : null,
        stock_quantity: Math.max(0, Math.floor(Number(stock))),
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

      toast.success("Produto criado!");
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
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/produtos")}
            className="p-2 hover:bg-secondary rounded-xl transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button onClick={handleSave} disabled={!canSave || saving} className="h-10">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar produto
                </>
              )}
            </Button>
          </motion.div>
        </div>

        <Tabs defaultValue="basico" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="basico" className="gap-2">
              <Package className="w-4 h-4" /> Básico
            </TabsTrigger>
            <TabsTrigger value="preco" className="gap-2">
              <DollarSign className="w-4 h-4" /> Preço/Estoque
            </TabsTrigger>
            <TabsTrigger value="midia" className="gap-2">
              <ImageIcon className="w-4 h-4" /> Imagens
            </TabsTrigger>
            <TabsTrigger value="descricao" className="gap-2">
              <FileText className="w-4 h-4" /> Descrição
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basico" className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Bolsa Allura" className="mt-1" />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>SKU</Label>
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Ex: ALR-001" className="mt-1" />
                </div>

                <div>
                  <Label>Marca</Label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value as ProductBrand)}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {PRODUCT_BRANDS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Categorias</Label>
                <div className="mt-2">
                  <CategorySelect selectedIds={categoryIds} onChange={setCategoryIds} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Em destaque
                </label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preco" className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label>Preço *</Label>
                  <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" className="mt-1" />
                </div>
                <div>
                  <Label>Preço original</Label>
                  <Input type="number" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="0,00" className="mt-1" />
                </div>
                <div>
                  <Label>Estoque *</Label>
                  <Input type="number" step="1" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Boxes className="w-4 h-4" />
                O estoque é validado ao criar pedidos.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="midia" className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <Label>Imagens</Label>
              <div className="mt-3">
                <ImageUpload images={images} onChange={setImages} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="descricao" className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <Label>Descrição</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do produto, materiais, medidas, etc."
                className="mt-2 min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
