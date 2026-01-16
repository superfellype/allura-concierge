import { motion } from "framer-motion";
import { Type, Image, Palette, AlignLeft, AlignCenter, AlignRight, Link2, Megaphone, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  EditorElementType, 
  EditorState, 
  ThemeConfig,
  NavbarConfig,
  HeroConfig,
  BenefitsConfig,
  ProductsConfig,
  FooterConfig,
  NewsletterConfig,
  BannerConfig,
} from "@/hooks/useEditorState";
import ImageUploadField from "./ImageUploadField";
import ThemePresets, { ThemePreset } from "./ThemePresets";
import BenefitsProperties from "./BenefitsProperties";

interface PropertiesPanelProps {
  selectedElement: EditorElementType | null;
  isThemeSelected: boolean;
  state: EditorState;
  onUpdateElement: <T extends EditorElementType>(id: T, updates: Partial<EditorState[T]>) => void;
  onUpdateTheme: (updates: Partial<ThemeConfig>) => void;
}

const FONT_OPTIONS = [
  "Playfair Display",
  "Inter",
  "Poppins",
  "Montserrat",
  "Lora",
  "Roboto",
  "Open Sans",
  "Merriweather",
];

function ColorInput({ 
  value, 
  onChange, 
  label 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 h-10 font-mono text-xs"
        />
      </div>
    </div>
  );
}

function NavbarProperties({ 
  config, 
  onChange 
}: { 
  config: NavbarConfig; 
  onChange: (updates: Partial<NavbarConfig>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs">Nome da Marca</Label>
        <Input
          value={config.brandName}
          onChange={(e) => onChange({ brandName: e.target.value })}
          placeholder="Allura"
        />
      </div>

      <ImageUploadField
        label="Logo"
        value={config.logoUrl}
        onChange={(url) => onChange({ logoUrl: url })}
        folder="logos"
        aspectRatio="banner"
      />

      <ColorInput
        label="Cor de Fundo"
        value={config.backgroundColor}
        onChange={(v) => onChange({ backgroundColor: v })}
      />

      <ColorInput
        label="Cor do Texto"
        value={config.textColor}
        onChange={(v) => onChange({ textColor: v })}
      />

      <div className="flex items-center justify-between">
        <Label className="text-xs">Mostrar Carrinho</Label>
        <Switch
          checked={config.showCart}
          onCheckedChange={(v) => onChange({ showCart: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Fixo no Topo</Label>
        <Switch
          checked={config.sticky}
          onCheckedChange={(v) => onChange({ sticky: v })}
        />
      </div>
    </div>
  );
}

function HeroProperties({ 
  config, 
  onChange 
}: { 
  config: HeroConfig; 
  onChange: (updates: Partial<HeroConfig>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs">Título</Label>
        <Textarea
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Elegância que conta histórias"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Subtítulo</Label>
        <Input
          value={config.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Bolsas artesanais..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Texto do Botão</Label>
        <Input
          value={config.ctaText}
          onChange={(e) => onChange({ ctaText: e.target.value })}
          placeholder="Ver Coleção"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Link do Botão</Label>
        <Input
          value={config.ctaUrl}
          onChange={(e) => onChange({ ctaUrl: e.target.value })}
          placeholder="/produtos"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Alinhamento</Label>
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => onChange({ alignment: align })}
              className={`flex-1 p-2.5 rounded-lg border-2 transition-all ${
                config.alignment === align
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {align === "left" && <AlignLeft className="w-4 h-4 mx-auto" />}
              {align === "center" && <AlignCenter className="w-4 h-4 mx-auto" />}
              {align === "right" && <AlignRight className="w-4 h-4 mx-auto" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <Label>Altura Mínima</Label>
          <span className="text-muted-foreground">{config.minHeight || 450}px</span>
        </div>
        <Slider
          value={[config.minHeight || 450]}
          onValueChange={([v]) => onChange({ minHeight: v })}
          min={300}
          max={800}
          step={50}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Tipo de Fundo</Label>
        <Select
          value={config.backgroundType}
          onValueChange={(v: "color" | "image" | "gradient") => onChange({ backgroundType: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="color">Cor Sólida</SelectItem>
            <SelectItem value="gradient">Gradiente</SelectItem>
            <SelectItem value="image">Imagem</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.backgroundType === "color" && (
        <ColorInput
          label="Cor de Fundo"
          value={config.backgroundColor}
          onChange={(v) => onChange({ backgroundColor: v })}
        />
      )}

      {config.backgroundType === "image" && (
        <>
          <ImageUploadField
            label="Imagem de Fundo"
            value={config.backgroundImage}
            onChange={(url) => onChange({ backgroundImage: url })}
            folder="hero"
            aspectRatio="video"
          />
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label>Opacidade do Overlay</Label>
              <span className="text-muted-foreground">{config.overlayOpacity}%</span>
            </div>
            <Slider
              value={[config.overlayOpacity]}
              onValueChange={([v]) => onChange({ overlayOpacity: v })}
              max={100}
              step={5}
            />
          </div>
        </>
      )}

      <ColorInput
        label="Cor do Texto"
        value={config.textColor}
        onChange={(v) => onChange({ textColor: v })}
      />

      <div className="space-y-2">
        <Label className="text-xs">Animação de Entrada</Label>
        <Select
          value={config.animation || "fade"}
          onValueChange={(v: "none" | "fade" | "slide" | "zoom") => onChange({ animation: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="fade">Fade In</SelectItem>
            <SelectItem value="slide">Slide Up</SelectItem>
            <SelectItem value="zoom">Zoom In</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ProductsProperties({ 
  config, 
  onChange 
}: { 
  config: ProductsConfig; 
  onChange: (updates: Partial<ProductsConfig>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs">Título da Seção</Label>
        <Input
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Destaques"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Layout</Label>
        <Select
          value={config.layout}
          onValueChange={(v: "grid" | "carousel") => onChange({ layout: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grade</SelectItem>
            <SelectItem value="carousel">Carrossel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Colunas</Label>
        <Select
          value={String(config.columns)}
          onValueChange={(v) => onChange({ columns: Number(v) as 2 | 3 | 4 })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 colunas</SelectItem>
            <SelectItem value="3">3 colunas</SelectItem>
            <SelectItem value="4">4 colunas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <Label>Máximo de Produtos</Label>
          <span className="text-muted-foreground">{config.maxItems}</span>
        </div>
        <Slider
          value={[config.maxItems]}
          onValueChange={([v]) => onChange({ maxItems: v })}
          min={4}
          max={16}
          step={2}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Apenas Destaques</Label>
        <Switch
          checked={config.showFeaturedOnly}
          onCheckedChange={(v) => onChange({ showFeaturedOnly: v })}
        />
      </div>

      <ColorInput
        label="Cor de Fundo"
        value={config.backgroundColor}
        onChange={(v) => onChange({ backgroundColor: v })}
      />
    </div>
  );
}

function NewsletterProperties({ 
  config, 
  onChange 
}: { 
  config: NewsletterConfig; 
  onChange: (updates: Partial<NewsletterConfig>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Ativar Newsletter</Label>
        <Switch
          checked={config.enabled}
          onCheckedChange={(v) => onChange({ enabled: v })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Título</Label>
        <Input
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Receba novidades..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Subtítulo</Label>
        <Input
          value={config.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Seja a primeira..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Texto do Botão</Label>
        <Input
          value={config.buttonText}
          onChange={(e) => onChange({ buttonText: e.target.value })}
          placeholder="Inscrever"
        />
      </div>

      <ColorInput
        label="Cor de Fundo"
        value={config.backgroundColor}
        onChange={(v) => onChange({ backgroundColor: v })}
      />

      <ColorInput
        label="Cor do Texto"
        value={config.textColor}
        onChange={(v) => onChange({ textColor: v })}
      />
    </div>
  );
}

function BannerProperties({ 
  config, 
  onChange 
}: { 
  config: BannerConfig; 
  onChange: (updates: Partial<BannerConfig>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Ativar Banner</Label>
        <Switch
          checked={config.enabled}
          onCheckedChange={(v) => onChange({ enabled: v })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Texto do Banner</Label>
        <Input
          value={config.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Frete grátis..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Texto do Link</Label>
        <Input
          value={config.linkText}
          onChange={(e) => onChange({ linkText: e.target.value })}
          placeholder="Aproveite →"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">URL do Link</Label>
        <Input
          value={config.linkUrl}
          onChange={(e) => onChange({ linkUrl: e.target.value })}
          placeholder="/produtos"
        />
      </div>

      <ColorInput
        label="Cor de Fundo"
        value={config.backgroundColor}
        onChange={(v) => onChange({ backgroundColor: v })}
      />

      <ColorInput
        label="Cor do Texto"
        value={config.textColor}
        onChange={(v) => onChange({ textColor: v })}
      />
    </div>
  );
}

function FooterProperties({ 
  config, 
  onChange 
}: { 
  config: FooterConfig; 
  onChange: (updates: Partial<FooterConfig>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs">Texto Sobre</Label>
        <Textarea
          value={config.aboutText}
          onChange={(e) => onChange({ aboutText: e.target.value })}
          placeholder="Sobre a marca..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Copyright</Label>
        <Input
          value={config.copyright}
          onChange={(e) => onChange({ copyright: e.target.value })}
          placeholder="© 2024 Allura..."
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Mostrar Redes Sociais</Label>
        <Switch
          checked={config.showSocial}
          onCheckedChange={(v) => onChange({ showSocial: v })}
        />
      </div>

      <ColorInput
        label="Cor de Fundo"
        value={config.backgroundColor}
        onChange={(v) => onChange({ backgroundColor: v })}
      />

      <ColorInput
        label="Cor do Texto"
        value={config.textColor}
        onChange={(v) => onChange({ textColor: v })}
      />
    </div>
  );
}

function ThemeProperties({ 
  config, 
  onChange,
  onApplyPreset,
}: { 
  config: ThemeConfig; 
  onChange: (updates: Partial<ThemeConfig>) => void;
  onApplyPreset: (preset: ThemePreset) => void;
}) {
  return (
    <Tabs defaultValue="cores" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="cores">Cores</TabsTrigger>
        <TabsTrigger value="presets">Presets</TabsTrigger>
      </TabsList>

      <TabsContent value="cores" className="space-y-5">
        <ColorInput
          label="Cor Primária"
          value={config.primaryColor}
          onChange={(v) => onChange({ primaryColor: v })}
        />

        <ColorInput
          label="Cor de Destaque"
          value={config.accentColor}
          onChange={(v) => onChange({ accentColor: v })}
        />

        <ColorInput
          label="Cor de Fundo Geral"
          value={config.backgroundColor}
          onChange={(v) => onChange({ backgroundColor: v })}
        />

        <ColorInput
          label="Cor do Texto"
          value={config.textColor}
          onChange={(v) => onChange({ textColor: v })}
        />

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <Label>Arredondamento</Label>
            <span className="text-muted-foreground">{config.borderRadius}px</span>
          </div>
          <Slider
            value={[config.borderRadius]}
            onValueChange={([v]) => onChange({ borderRadius: v })}
            max={32}
            step={2}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Fonte de Títulos</Label>
          <Select
            value={config.fontDisplay}
            onValueChange={(v) => onChange({ fontDisplay: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Fonte de Corpo</Label>
          <Select
            value={config.fontBody}
            onValueChange={(v) => onChange({ fontBody: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="presets">
        <ThemePresets
          currentTheme={config}
          onApplyPreset={onApplyPreset}
        />
      </TabsContent>
    </Tabs>
  );
}

export default function PropertiesPanel({
  selectedElement,
  isThemeSelected,
  state,
  onUpdateElement,
  onUpdateTheme,
}: PropertiesPanelProps) {
  const handleApplyPreset = (preset: ThemePreset) => {
    onUpdateTheme({
      primaryColor: preset.colors.primary,
      accentColor: preset.colors.accent,
      backgroundColor: preset.colors.background,
      textColor: preset.colors.text,
      fontDisplay: preset.fonts.display,
      fontBody: preset.fonts.body,
      borderRadius: preset.borderRadius,
    });
  };

  if (!selectedElement && !isThemeSelected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
          <Palette className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Selecione um elemento no canvas ou na lista de camadas para editar
        </p>
      </div>
    );
  }

  const getTitle = () => {
    if (isThemeSelected) return "Tema & Cores";
    switch (selectedElement) {
      case "navbar": return "Navegação";
      case "hero": return "Hero";
      case "benefits": return "Benefícios";
      case "products": return "Produtos";
      case "newsletter": return "Newsletter";
      case "banner": return "Banner";
      case "footer": return "Rodapé";
      default: return "Propriedades";
    }
  };

  const getIcon = () => {
    if (isThemeSelected) return Palette;
    switch (selectedElement) {
      case "navbar": return Type;
      case "hero": return Image;
      case "newsletter": return Newspaper;
      case "banner": return Megaphone;
      case "products": return Link2;
      default: return Palette;
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      key={selectedElement || "theme"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-sm">{getTitle()}</h3>
      </div>

      <div className="space-y-1">
        {isThemeSelected && (
          <ThemeProperties 
            config={state.theme} 
            onChange={onUpdateTheme}
            onApplyPreset={handleApplyPreset}
          />
        )}
        {selectedElement === "navbar" && (
          <NavbarProperties 
            config={state.navbar} 
            onChange={(updates) => onUpdateElement("navbar", updates)} 
          />
        )}
        {selectedElement === "hero" && (
          <HeroProperties 
            config={state.hero} 
            onChange={(updates) => onUpdateElement("hero", updates)} 
          />
        )}
        {selectedElement === "benefits" && (
          <BenefitsProperties 
            config={state.benefits} 
            onChange={(updates) => onUpdateElement("benefits", updates)} 
          />
        )}
        {selectedElement === "products" && (
          <ProductsProperties 
            config={state.products} 
            onChange={(updates) => onUpdateElement("products", updates)} 
          />
        )}
        {selectedElement === "newsletter" && (
          <NewsletterProperties 
            config={state.newsletter} 
            onChange={(updates) => onUpdateElement("newsletter", updates)} 
          />
        )}
        {selectedElement === "banner" && (
          <BannerProperties 
            config={state.banner} 
            onChange={(updates) => onUpdateElement("banner", updates)} 
          />
        )}
        {selectedElement === "footer" && (
          <FooterProperties 
            config={state.footer} 
            onChange={(updates) => onUpdateElement("footer", updates)} 
          />
        )}
      </div>
    </motion.div>
  );
}
