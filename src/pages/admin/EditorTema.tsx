import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Palette, Monitor, Smartphone, RotateCcw, Save, Loader2, 
  CheckCircle, Eye, Code, Sparkles, Sun, Moon, Play
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface ThemeConfig {
  // Colors
  primaryHue: number;
  primarySaturation: number;
  primaryLightness: number;
  accentHue: number;
  accentSaturation: number;
  accentLightness: number;
  backgroundLightness: number;
  cardLightness: number;
  borderRadius: number;
  // Typography
  fontDisplay: string;
  fontBody: string;
  // Content
  brandName: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroCta: string;
}

const DEFAULT_THEME: ThemeConfig = {
  primaryHue: 16,
  primarySaturation: 60,
  primaryLightness: 50,
  accentHue: 38,
  accentSaturation: 45,
  accentLightness: 75,
  backgroundLightness: 96,
  cardLightness: 98,
  borderRadius: 16,
  fontDisplay: "Playfair Display",
  fontBody: "Inter",
  brandName: "Allura",
  logoUrl: "",
  heroTitle: "Elegância que conta histórias",
  heroSubtitle: "Bolsas artesanais com design atemporal",
  heroImageUrl: "",
  heroCta: "Ver Coleção",
};

const FONT_OPTIONS = [
  { value: "Playfair Display", label: "Playfair Display", category: "Serif" },
  { value: "Inter", label: "Inter", category: "Sans-serif" },
  { value: "Poppins", label: "Poppins", category: "Sans-serif" },
  { value: "Montserrat", label: "Montserrat", category: "Sans-serif" },
  { value: "Lora", label: "Lora", category: "Serif" },
  { value: "Roboto", label: "Roboto", category: "Sans-serif" },
  { value: "Open Sans", label: "Open Sans", category: "Sans-serif" },
  { value: "Merriweather", label: "Merriweather", category: "Serif" },
];

export default function EditorTema() {
  const { settings, loading, updateMultiple } = useSiteSettings();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Load settings into theme
  useEffect(() => {
    if (!loading && settings) {
      setTheme((prev) => ({
        ...prev,
        brandName: settings.brand_name || prev.brandName,
        logoUrl: settings.logo_url || prev.logoUrl,
        heroTitle: settings.hero_title || prev.heroTitle,
        heroSubtitle: settings.hero_subtitle || prev.heroSubtitle,
        heroImageUrl: settings.hero_image_url || prev.heroImageUrl,
        heroCta: settings.hero_cta_text || prev.heroCta,
      }));
    }
  }, [settings, loading]);

  const updateTheme = useCallback((key: keyof ThemeConfig, value: any) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
    setHasChanges(true);
    toast.info("Tema resetado para o padrão");
  };

  const handlePublish = async () => {
    setPublishing(true);
    
    const updates: Record<string, any> = {
      brand_name: theme.brandName,
      logo_url: theme.logoUrl,
      hero_title: theme.heroTitle,
      hero_subtitle: theme.heroSubtitle,
      hero_image_url: theme.heroImageUrl,
      hero_cta_text: theme.heroCta,
      primary_color: `hsl(${theme.primaryHue}, ${theme.primarySaturation}%, ${theme.primaryLightness}%)`,
      accent_color: `hsl(${theme.accentHue}, ${theme.accentSaturation}%, ${theme.accentLightness}%)`,
    };

    const { error } = await updateMultiple(updates);
    
    if (error) {
      toast.error("Erro ao publicar alterações");
    } else {
      toast.success("🎉 Tema publicado com sucesso!");
      setHasChanges(false);
    }
    setPublishing(false);
  };

  // Generate CSS variables for preview
  const previewStyles = {
    "--primary": `${theme.primaryHue} ${theme.primarySaturation}% ${theme.primaryLightness}%`,
    "--accent": `${theme.accentHue} ${theme.accentSaturation}% ${theme.accentLightness}%`,
    "--background": `30 25% ${isDarkMode ? 6 : theme.backgroundLightness}%`,
    "--card": `30 20% ${isDarkMode ? 10 : theme.cardLightness}%`,
    "--foreground": isDarkMode ? "30 20% 95%" : "20 15% 15%",
    "--muted-foreground": isDarkMode ? "30 15% 60%" : "20 10% 45%",
    "--border": isDarkMode ? "20 12% 18%" : "30 20% 88%",
    "--radius": `${theme.borderRadius}px`,
    fontFamily: `'${theme.fontBody}', sans-serif`,
  } as React.CSSProperties;

  if (loading) {
    return (
      <AdminLayout title="Editor de Tema">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Editor de Tema">
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-4 px-1"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold">Editor de Tema</h1>
              <p className="text-xs text-muted-foreground">
                {hasChanges ? "Alterações não publicadas" : "Todas as alterações publicadas"}
              </p>
            </div>
            {hasChanges && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium animate-pulse">
                Rascunho
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Device Toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-2 rounded-md transition-colors ${
                  previewDevice === "desktop" ? "bg-background shadow-sm" : ""
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-2 rounded-md transition-colors ${
                  previewDevice === "mobile" ? "bg-background shadow-sm" : ""
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <Button variant="outline" size="sm" onClick={resetTheme}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>

            <Button
              onClick={handlePublish}
              disabled={!hasChanges || publishing}
              className="gap-2"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 grid lg:grid-cols-5 gap-4 min-h-0">
          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
          >
            <Tabs defaultValue="colors" className="flex flex-col h-full">
              <TabsList className="w-full rounded-none border-b border-border bg-secondary/30 p-1">
                <TabsTrigger value="colors" className="flex-1 gap-1.5 text-xs">
                  <Palette className="w-3.5 h-3.5" /> Cores
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex-1 gap-1.5 text-xs">
                  <Code className="w-3.5 h-3.5" /> Tipografia
                </TabsTrigger>
                <TabsTrigger value="content" className="flex-1 gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Conteúdo
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-4">
                <TabsContent value="colors" className="mt-0 space-y-6">
                  {/* Primary Color */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Cor Primária</Label>
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-border shadow-inner"
                        style={{
                          backgroundColor: `hsl(${theme.primaryHue}, ${theme.primarySaturation}%, ${theme.primaryLightness}%)`,
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Matiz</span>
                          <span>{theme.primaryHue}°</span>
                        </div>
                        <Slider
                          value={[theme.primaryHue]}
                          onValueChange={([v]) => updateTheme("primaryHue", v)}
                          max={360}
                          step={1}
                          className="hue-slider"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Saturação</span>
                          <span>{theme.primarySaturation}%</span>
                        </div>
                        <Slider
                          value={[theme.primarySaturation]}
                          onValueChange={([v]) => updateTheme("primarySaturation", v)}
                          max={100}
                          step={1}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Luminosidade</span>
                          <span>{theme.primaryLightness}%</span>
                        </div>
                        <Slider
                          value={[theme.primaryLightness]}
                          onValueChange={([v]) => updateTheme("primaryLightness", v)}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Accent Color */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Cor de Destaque</Label>
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-border shadow-inner"
                        style={{
                          backgroundColor: `hsl(${theme.accentHue}, ${theme.accentSaturation}%, ${theme.accentLightness}%)`,
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Matiz</span>
                          <span>{theme.accentHue}°</span>
                        </div>
                        <Slider
                          value={[theme.accentHue]}
                          onValueChange={([v]) => updateTheme("accentHue", v)}
                          max={360}
                          step={1}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Saturação</span>
                          <span>{theme.accentSaturation}%</span>
                        </div>
                        <Slider
                          value={[theme.accentSaturation]}
                          onValueChange={([v]) => updateTheme("accentSaturation", v)}
                          max={100}
                          step={1}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Luminosidade</span>
                          <span>{theme.accentLightness}%</span>
                        </div>
                        <Slider
                          value={[theme.accentLightness]}
                          onValueChange={([v]) => updateTheme("accentLightness", v)}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Background & UI */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Interface</Label>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Fundo</span>
                        <span>{theme.backgroundLightness}%</span>
                      </div>
                      <Slider
                        value={[theme.backgroundLightness]}
                        onValueChange={([v]) => updateTheme("backgroundLightness", v)}
                        min={90}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Arredondamento</span>
                        <span>{theme.borderRadius}px</span>
                      </div>
                      <Slider
                        value={[theme.borderRadius]}
                        onValueChange={([v]) => updateTheme("borderRadius", v)}
                        min={0}
                        max={32}
                        step={2}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="typography" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Fonte de Títulos</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {FONT_OPTIONS.filter((f) => f.category === "Serif").map((font) => (
                          <button
                            key={font.value}
                            onClick={() => updateTheme("fontDisplay", font.value)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              theme.fontDisplay === font.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                            style={{ fontFamily: font.value }}
                          >
                            <span className="text-lg font-medium">Aa</span>
                            <p className="text-xs text-muted-foreground mt-1">{font.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">Fonte de Corpo</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {FONT_OPTIONS.filter((f) => f.category === "Sans-serif").map((font) => (
                          <button
                            key={font.value}
                            onClick={() => updateTheme("fontBody", font.value)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              theme.fontBody === font.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/40"
                            }`}
                            style={{ fontFamily: font.value }}
                          >
                            <span className="text-lg">Aa</span>
                            <p className="text-xs text-muted-foreground mt-1">{font.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="mt-0 space-y-5">
                  <div className="space-y-2">
                    <Label>Nome da Marca</Label>
                    <Input
                      value={theme.brandName}
                      onChange={(e) => updateTheme("brandName", e.target.value)}
                      placeholder="Ex: Allura"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL do Logo</Label>
                    <Input
                      value={theme.logoUrl}
                      onChange={(e) => updateTheme("logoUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="h-px bg-border" />

                  <div className="space-y-2">
                    <Label>Título do Hero</Label>
                    <Input
                      value={theme.heroTitle}
                      onChange={(e) => updateTheme("heroTitle", e.target.value)}
                      placeholder="Elegância que conta histórias"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Input
                      value={theme.heroSubtitle}
                      onChange={(e) => updateTheme("heroSubtitle", e.target.value)}
                      placeholder="Bolsas artesanais com design atemporal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Botão CTA</Label>
                    <Input
                      value={theme.heroCta}
                      onChange={(e) => updateTheme("heroCta", e.target.value)}
                      placeholder="Ver Coleção"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Imagem do Hero</Label>
                    <Input
                      value={theme.heroImageUrl}
                      onChange={(e) => updateTheme("heroImageUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 bg-secondary/30 border border-border rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-background/50 rounded-lg px-3 py-1.5 text-xs text-muted-foreground text-center">
                  preview.allura.com
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                <span>Ao vivo</span>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
              <div
                className={`transition-all duration-300 ${
                  previewDevice === "mobile" ? "w-[375px]" : "w-full max-w-4xl"
                }`}
              >
                <div
                  style={previewStyles}
                  className={`rounded-xl overflow-hidden shadow-2xl border border-border ${
                    isDarkMode ? "bg-[hsl(20,15%,6%)]" : "bg-[hsl(30,25%,96%)]"
                  }`}
                >
                  {/* Simulated Navbar */}
                  <div
                    className="px-6 py-4 border-b"
                    style={{
                      backgroundColor: isDarkMode ? "hsl(20, 15%, 10%)" : "hsl(30, 20%, 98%)",
                      borderColor: isDarkMode ? "hsl(20, 12%, 18%)" : "hsl(30, 20%, 88%)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {theme.logoUrl ? (
                          <img
                            src={theme.logoUrl}
                            alt="Logo"
                            className="h-8 object-contain"
                          />
                        ) : (
                          <span
                            className="text-xl font-bold"
                            style={{
                              fontFamily: `'${theme.fontDisplay}', serif`,
                              color: `hsl(${theme.primaryHue}, ${theme.primarySaturation}%, ${theme.primaryLightness}%)`,
                            }}
                          >
                            {theme.brandName}
                          </span>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-4 text-sm"
                        style={{
                          color: isDarkMode ? "hsl(30, 20%, 95%)" : "hsl(20, 15%, 15%)",
                        }}
                      >
                        <span>Produtos</span>
                        <span>Sobre</span>
                        <span>Contato</span>
                      </div>
                    </div>
                  </div>

                  {/* Hero Section */}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      minHeight: previewDevice === "mobile" ? "300px" : "400px",
                      backgroundColor: `hsl(${theme.accentHue}, ${theme.accentSaturation}%, ${Math.min(theme.accentLightness + 20, 95)}%)`,
                    }}
                  >
                    {theme.heroImageUrl && (
                      <img
                        src={theme.heroImageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-30"
                      />
                    )}
                    <div className="relative z-10 p-8 flex flex-col items-center justify-center text-center h-full min-h-[inherit]">
                      <h1
                        className="text-3xl md:text-4xl font-bold mb-3"
                        style={{
                          fontFamily: `'${theme.fontDisplay}', serif`,
                          color: isDarkMode ? "hsl(30, 20%, 95%)" : "hsl(20, 15%, 15%)",
                        }}
                      >
                        {theme.heroTitle}
                      </h1>
                      <p
                        className="text-lg mb-6 opacity-80"
                        style={{
                          fontFamily: `'${theme.fontBody}', sans-serif`,
                          color: isDarkMode ? "hsl(30, 15%, 60%)" : "hsl(20, 10%, 45%)",
                        }}
                      >
                        {theme.heroSubtitle}
                      </p>
                      <button
                        className="px-6 py-3 text-white font-medium transition-transform hover:scale-105"
                        style={{
                          backgroundColor: `hsl(${theme.primaryHue}, ${theme.primarySaturation}%, ${theme.primaryLightness}%)`,
                          borderRadius: `${theme.borderRadius}px`,
                          fontFamily: `'${theme.fontBody}', sans-serif`,
                        }}
                      >
                        {theme.heroCta}
                      </button>
                    </div>
                  </div>

                  {/* Simulated Products */}
                  <div
                    className="p-6"
                    style={{
                      backgroundColor: isDarkMode ? "hsl(20, 15%, 6%)" : "hsl(30, 25%, 96%)",
                    }}
                  >
                    <h2
                      className="text-xl font-bold mb-4"
                      style={{
                        fontFamily: `'${theme.fontDisplay}', serif`,
                        color: isDarkMode ? "hsl(30, 20%, 95%)" : "hsl(20, 15%, 15%)",
                      }}
                    >
                      Destaques
                    </h2>
                    <div
                      className={`grid gap-4 ${
                        previewDevice === "mobile" ? "grid-cols-2" : "grid-cols-3"
                      }`}
                    >
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="overflow-hidden"
                          style={{
                            backgroundColor: isDarkMode ? "hsl(20, 15%, 10%)" : "hsl(30, 20%, 98%)",
                            borderRadius: `${theme.borderRadius}px`,
                            border: `1px solid ${isDarkMode ? "hsl(20, 12%, 18%)" : "hsl(30, 20%, 88%)"}`,
                          }}
                        >
                          <div
                            className="aspect-square"
                            style={{
                              backgroundColor: `hsl(${theme.accentHue}, ${theme.accentSaturation - 20}%, ${theme.accentLightness + 10}%)`,
                            }}
                          />
                          <div className="p-3">
                            <div
                              className="h-3 rounded mb-2"
                              style={{
                                backgroundColor: isDarkMode ? "hsl(20, 12%, 18%)" : "hsl(30, 20%, 88%)",
                                width: "80%",
                              }}
                            />
                            <div
                              className="h-3 rounded"
                              style={{
                                backgroundColor: `hsl(${theme.primaryHue}, ${theme.primarySaturation}%, ${theme.primaryLightness}%)`,
                                width: "50%",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
