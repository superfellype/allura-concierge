import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Palette, Home, Phone, Share2, FileText, Search, Settings, 
  Save, Loader2, Plus, Trash2, Upload, Eye, ExternalLink,
  Instagram, Facebook, Youtube, Image, Type, MapPin, Mail,
  CreditCard, Truck, ShoppingCart, Globe
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import SingleImageUpload from "@/components/admin/SingleImageUpload";
import SiteSettingsLivePreview from "@/components/admin/SiteSettingsLivePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { BenefitItem, FooterLink } from "@/services/site-settings.service";
import { Link } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const ICON_OPTIONS = [
  { value: "Truck", label: "Entrega" },
  { value: "CreditCard", label: "Cartão" },
  { value: "Shield", label: "Segurança" },
  { value: "Gift", label: "Presente" },
  { value: "Heart", label: "Coração" },
  { value: "Star", label: "Estrela" },
  { value: "Clock", label: "Relógio" },
  { value: "Award", label: "Prêmio" },
];

export default function Personalizacao() {
  const { settings, loading, updateMultiple, getSetting, refresh } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!loading && Object.keys(settings).length > 0) {
      setFormData(settings);
    }
  }, [settings, loading]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Find changed values
    const changes: Record<string, any> = {};
    Object.keys(formData).forEach(key => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(settings[key])) {
        changes[key] = formData[key];
      }
    });

    if (Object.keys(changes).length === 0) {
      toast.info("Nenhuma alteração para salvar");
      setSaving(false);
      return;
    }

    const { error } = await updateMultiple(changes);
    
    if (error) {
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas com sucesso!");
      setHasChanges(false);
    }
    setSaving(false);
  };

  const handleBenefitChange = (index: number, field: keyof BenefitItem, value: string) => {
    const benefits = [...(formData.benefits || [])];
    benefits[index] = { ...benefits[index], [field]: value };
    handleChange('benefits', benefits);
  };

  const addBenefit = () => {
    const benefits = [...(formData.benefits || [])];
    benefits.push({ icon: "Star", title: "", description: "" });
    handleChange('benefits', benefits);
  };

  const removeBenefit = (index: number) => {
    const benefits = [...(formData.benefits || [])];
    benefits.splice(index, 1);
    handleChange('benefits', benefits);
  };

  const handleFooterLinkChange = (index: number, field: keyof FooterLink, value: string) => {
    const links = [...(formData.footer_links || [])];
    links[index] = { ...links[index], [field]: value };
    handleChange('footer_links', links);
  };

  const addFooterLink = () => {
    const links = [...(formData.footer_links || [])];
    links.push({ label: "", url: "" });
    handleChange('footer_links', links);
  };

  const removeFooterLink = (index: number) => {
    const links = [...(formData.footer_links || [])];
    links.splice(index, 1);
    handleChange('footer_links', links);
  };

  if (loading) {
    return (
      <AdminLayout title="Personalização">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Personalização do Site">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Personalização</h1>
            <p className="text-muted-foreground text-sm">
              Configure a aparência e conteúdo do seu site
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/" target="_blank" className="gap-2">
                <Eye className="w-4 h-4" />
                Ver Site
              </Link>
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              className="gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Alterações
            </Button>
          </div>
        </motion.div>

        {hasChanges && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-700 text-sm flex items-center gap-2"
          >
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            Você tem alterações não salvas
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">
          <div className="min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1 bg-muted/50">
                <TabsTrigger value="identity" className="gap-2 text-xs sm:text-sm py-2">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Identidade</span>
                </TabsTrigger>
                <TabsTrigger value="home" className="gap-2 text-xs sm:text-sm py-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="gap-2 text-xs sm:text-sm py-2">
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Contato</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="gap-2 text-xs sm:text-sm py-2">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Redes</span>
                </TabsTrigger>
                <TabsTrigger value="footer" className="gap-2 text-xs sm:text-sm py-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Rodapé</span>
                </TabsTrigger>
                <TabsTrigger value="pages" className="gap-2 text-xs sm:text-sm py-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Páginas</span>
                </TabsTrigger>
                <TabsTrigger value="seo" className="gap-2 text-xs sm:text-sm py-2">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">SEO</span>
                </TabsTrigger>
                <TabsTrigger value="ecommerce" className="gap-2 text-xs sm:text-sm py-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Loja</span>
                </TabsTrigger>
              </TabsList>

              {/* IDENTITY TAB */}
              <TabsContent value="identity" className="space-y-6">
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-primary" />
                        Marca
                      </CardTitle>
                      <CardDescription>Nome e slogan da sua loja</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome da Marca</Label>
                          <Input
                            value={formData.brand_name || ''}
                            onChange={(e) => handleChange('brand_name', e.target.value)}
                            placeholder="Nome da sua loja"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slogan / Tagline</Label>
                          <Input
                            value={formData.brand_tagline || ''}
                            onChange={(e) => handleChange('brand_tagline', e.target.value)}
                            placeholder="Frase de efeito"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-primary" />
                        Logos
                      </CardTitle>
                      <CardDescription>Imagens de logo da sua loja</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SingleImageUpload
                          value={formData.logo_url || ''}
                          onChange={(url) => handleChange('logo_url', url)}
                          folder="logos"
                          label="Logo Principal"
                          aspectRatio="square"
                        />
                        <SingleImageUpload
                          value={formData.logo_text_url || ''}
                          onChange={(url) => handleChange('logo_text_url', url)}
                          folder="logos"
                          label="Logo Texto"
                          aspectRatio="logo"
                        />
                        <SingleImageUpload
                          value={formData.favicon_url || ''}
                          onChange={(url) => handleChange('favicon_url', url)}
                          folder="logos"
                          label="Favicon"
                          aspectRatio="square"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        Cores
                      </CardTitle>
                      <CardDescription>Cores principais do site</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Cor Primária</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.primary_color || '#d97706'}
                              onChange={(e) => handleChange('primary_color', e.target.value)}
                              className="w-14 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={formData.primary_color || '#d97706'}
                              onChange={(e) => handleChange('primary_color', e.target.value)}
                              placeholder="#d97706"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Cor de Destaque</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={formData.accent_color || '#fbbf24'}
                              onChange={(e) => handleChange('accent_color', e.target.value)}
                              className="w-14 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={formData.accent_color || '#fbbf24'}
                              onChange={(e) => handleChange('accent_color', e.target.value)}
                              placeholder="#fbbf24"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

          {/* HOME TAB */}
          <TabsContent value="home" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Hero / Banner Principal</CardTitle>
                  <CardDescription>Seção de destaque na página inicial</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={formData.hero_title || ''}
                        onChange={(e) => handleChange('hero_title', e.target.value)}
                        placeholder="Título do hero"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtítulo</Label>
                      <Input
                        value={formData.hero_subtitle || ''}
                        onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                        placeholder="Subtítulo do hero"
                      />
                    </div>
                  </div>
                  <SingleImageUpload
                    value={formData.hero_image_url || ''}
                    onChange={(url) => handleChange('hero_image_url', url)}
                    folder="hero"
                    label="Imagem de Fundo"
                    aspectRatio="banner"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Texto do Botão</Label>
                      <Input
                        value={formData.hero_cta_text || ''}
                        onChange={(e) => handleChange('hero_cta_text', e.target.value)}
                        placeholder="Ver Coleção"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link do Botão</Label>
                      <Input
                        value={formData.hero_cta_link || ''}
                        onChange={(e) => handleChange('hero_cta_link', e.target.value)}
                        placeholder="/produtos"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Benefícios</CardTitle>
                      <CardDescription>Cards de benefícios na home</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Exibir</Label>
                      <Switch
                        checked={formData.benefits_enabled ?? true}
                        onCheckedChange={(v) => handleChange('benefits_enabled', v)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(formData.benefits || []).map((benefit: BenefitItem, index: number) => (
                    <div key={index} className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
                      <select
                        value={benefit.icon}
                        onChange={(e) => handleBenefitChange(index, 'icon', e.target.value)}
                        className="px-3 py-2 border rounded-md bg-background text-sm"
                      >
                        {ICON_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <Input
                        value={benefit.title}
                        onChange={(e) => handleBenefitChange(index, 'title', e.target.value)}
                        placeholder="Título"
                        className="flex-1"
                      />
                      <Input
                        value={benefit.description}
                        onChange={(e) => handleBenefitChange(index, 'description', e.target.value)}
                        placeholder="Descrição"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBenefit(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addBenefit} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Benefício
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Produtos em Destaque</CardTitle>
                  <CardDescription>Configurações da seção de destaques</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título da Seção</Label>
                      <Input
                        value={formData.featured_products_title || ''}
                        onChange={(e) => handleChange('featured_products_title', e.target.value)}
                        placeholder="Destaques"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade de Produtos</Label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.featured_products_limit || 8}
                        onChange={(e) => handleChange('featured_products_limit', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* CONTACT TAB */}
          <TabsContent value="contact" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    Contato
                  </CardTitle>
                  <CardDescription>Informações de contato da loja</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={formData.store_phone || ''}
                        onChange={(e) => handleChange('store_phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp</Label>
                      <Input
                        value={formData.store_whatsapp || ''}
                        onChange={(e) => handleChange('store_whatsapp', e.target.value)}
                        placeholder="5511999999999"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.store_email || ''}
                      onChange={(e) => handleChange('store_email', e.target.value)}
                      placeholder="contato@loja.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Endereço
                  </CardTitle>
                  <CardDescription>Endereço físico da loja (opcional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      value={formData.store_address || ''}
                      onChange={(e) => handleChange('store_address', e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input
                        value={formData.store_city || ''}
                        onChange={(e) => handleChange('store_city', e.target.value)}
                        placeholder="São Paulo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Input
                        value={formData.store_state || ''}
                        onChange={(e) => handleChange('store_state', e.target.value)}
                        placeholder="SP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CEP</Label>
                      <Input
                        value={formData.store_zip || ''}
                        onChange={(e) => handleChange('store_zip', e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* SOCIAL TAB */}
          <TabsContent value="social" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    Redes Sociais
                  </CardTitle>
                  <CardDescription>Links para suas redes sociais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </Label>
                      <Input
                        value={formData.social_instagram || ''}
                        onChange={(e) => handleChange('social_instagram', e.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </Label>
                      <Input
                        value={formData.social_facebook || ''}
                        onChange={(e) => handleChange('social_facebook', e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>TikTok</Label>
                      <Input
                        value={formData.social_tiktok || ''}
                        onChange={(e) => handleChange('social_tiktok', e.target.value)}
                        placeholder="https://tiktok.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Youtube className="w-4 h-4" />
                        YouTube
                      </Label>
                      <Input
                        value={formData.social_youtube || ''}
                        onChange={(e) => handleChange('social_youtube', e.target.value)}
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pinterest</Label>
                      <Input
                        value={formData.social_pinterest || ''}
                        onChange={(e) => handleChange('social_pinterest', e.target.value)}
                        placeholder="https://pinterest.com/..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* FOOTER TAB */}
          <TabsContent value="footer" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Rodapé</CardTitle>
                  <CardDescription>Conteúdo do rodapé do site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Texto sobre a loja</Label>
                    <Textarea
                      value={formData.footer_about_text || ''}
                      onChange={(e) => handleChange('footer_about_text', e.target.value)}
                      placeholder="Breve descrição da loja..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Copyright</Label>
                    <Input
                      value={formData.footer_copyright || ''}
                      onChange={(e) => handleChange('footer_copyright', e.target.value)}
                      placeholder="© 2024 Sua Loja. Todos os direitos reservados."
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Links do Rodapé</CardTitle>
                  <CardDescription>Links para páginas institucionais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(formData.footer_links || []).map((link: FooterLink, index: number) => (
                    <div key={index} className="flex gap-3 items-center">
                      <Input
                        value={link.label}
                        onChange={(e) => handleFooterLinkChange(index, 'label', e.target.value)}
                        placeholder="Texto do link"
                        className="flex-1"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => handleFooterLinkChange(index, 'url', e.target.value)}
                        placeholder="/pagina"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFooterLink(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addFooterLink} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Link
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* PAGES TAB */}
          <TabsContent value="pages" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Página Sobre</CardTitle>
                  <CardDescription>Conteúdo da página "Sobre Nós"</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={formData.page_about_title || ''}
                      onChange={(e) => handleChange('page_about_title', e.target.value)}
                      placeholder="Sobre Nós"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conteúdo (Markdown)</Label>
                    <Textarea
                      value={formData.page_about_content || ''}
                      onChange={(e) => handleChange('page_about_content', e.target.value)}
                      placeholder="História da sua marca..."
                      rows={8}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Política de Trocas</CardTitle>
                  <CardDescription>Regras de trocas e devoluções</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={formData.page_exchange_title || ''}
                      onChange={(e) => handleChange('page_exchange_title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <Textarea
                      value={formData.page_exchange_content || ''}
                      onChange={(e) => handleChange('page_exchange_content', e.target.value)}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Política de Privacidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={formData.page_privacy_title || ''}
                      onChange={(e) => handleChange('page_privacy_title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <Textarea
                      value={formData.page_privacy_content || ''}
                      onChange={(e) => handleChange('page_privacy_content', e.target.value)}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Termos de Uso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={formData.page_terms_title || ''}
                      onChange={(e) => handleChange('page_terms_title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <Textarea
                      value={formData.page_terms_content || ''}
                      onChange={(e) => handleChange('page_terms_content', e.target.value)}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* SEO TAB */}
          <TabsContent value="seo" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary" />
                    SEO - Otimização para Buscadores
                  </CardTitle>
                  <CardDescription>
                    Configurações para melhorar a visibilidade nos mecanismos de busca
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título do Site (máx. 60 caracteres)</Label>
                    <Input
                      value={formData.seo_title || ''}
                      onChange={(e) => handleChange('seo_title', e.target.value)}
                      placeholder="Sua Loja | Moda Feminina"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      {(formData.seo_title || '').length}/60 caracteres
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Descrição (máx. 160 caracteres)</Label>
                    <Textarea
                      value={formData.seo_description || ''}
                      onChange={(e) => handleChange('seo_description', e.target.value)}
                      placeholder="Descrição da sua loja para aparecer no Google..."
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {(formData.seo_description || '').length}/160 caracteres
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Palavras-chave</Label>
                    <Input
                      value={formData.seo_keywords || ''}
                      onChange={(e) => handleChange('seo_keywords', e.target.value)}
                      placeholder="moda feminina, roupas, acessórios"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separe as palavras por vírgula
                    </p>
                  </div>
                  <SingleImageUpload
                    value={formData.seo_og_image || ''}
                    onChange={(url) => handleChange('seo_og_image', url)}
                    folder="seo"
                    label="Imagem OG para Redes Sociais (1200x630px)"
                    aspectRatio="banner"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ECOMMERCE TAB */}
          <TabsContent value="ecommerce" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Moeda e Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Moeda</Label>
                      <Input
                        value={formData.currency || 'BRL'}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        placeholder="BRL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Símbolo</Label>
                      <Input
                        value={formData.currency_symbol || 'R$'}
                        onChange={(e) => handleChange('currency_symbol', e.target.value)}
                        placeholder="R$"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Máximo de Parcelas</Label>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        value={formData.max_installments || 12}
                        onChange={(e) => handleChange('max_installments', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Mínimo da Parcela</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.installment_min_value || 50}
                        onChange={(e) => handleChange('installment_min_value', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    Frete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frete Grátis acima de (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.free_shipping_threshold || 299}
                        onChange={(e) => handleChange('free_shipping_threshold', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        0 para desativar frete grátis
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Mínimo do Pedido (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.min_order_value || 0}
                        onChange={(e) => handleChange('min_order_value', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Exibição de Produtos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mostrar quantidade em estoque</Label>
                      <p className="text-xs text-muted-foreground">
                        Exibe a quantidade disponível para os clientes
                      </p>
                    </div>
                    <Switch
                      checked={formData.show_stock_quantity ?? false}
                      onCheckedChange={(v) => handleChange('show_stock_quantity', v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensagem de Estoque Baixo</Label>
                    <Input
                      value={formData.low_stock_message || ''}
                      onChange={(e) => handleChange('low_stock_message', e.target.value)}
                      placeholder="Poucas unidades disponíveis"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden lg:block">
        <SiteSettingsLivePreview settings={formData} />
      </div>
    </div>
      </motion.div>
    </AdminLayout>
  );
}
