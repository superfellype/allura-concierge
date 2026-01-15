import { useState } from "react";
import { ExternalLink, Monitor, Smartphone, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SiteSettingsLivePreviewProps {
  settings: Record<string, any>;
}

function getString(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function getBoolean(v: unknown, fallback = false) {
  return typeof v === "boolean" ? v : fallback;
}

export default function SiteSettingsLivePreview({ settings }: SiteSettingsLivePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const brandName = getString(settings.brand_name, "Sua marca");
  const tagline = getString(settings.brand_tagline, "");
  const logoUrl = getString(settings.logo_url, "");
  const primaryColor = getString(settings.primary_color, "#d97706");
  const accentColor = getString(settings.accent_color, "#fbbf24");

  const heroTitle = getString(settings.hero_title, "Título do Hero");
  const heroSubtitle = getString(settings.hero_subtitle, "Subtítulo do hero");
  const heroImageUrl = getString(settings.hero_image_url, "");
  const heroCtaText = getString(settings.hero_cta_text, "Ver produtos");

  const benefitsEnabled = getBoolean(settings.benefits_enabled, true);
  const benefits = Array.isArray(settings.benefits) ? settings.benefits : [];

  const footerAbout = getString(settings.footer_about_text, "");
  const footerCopyright = getString(settings.footer_copyright, "");
  const footerLinks = Array.isArray(settings.footer_links) ? settings.footer_links : [];

  // Social
  const instagram = getString(settings.social_instagram, "");
  const facebook = getString(settings.social_facebook, "");

  // Contact
  const phone = getString(settings.store_phone, "");
  const email = getString(settings.store_email, "");

  const handleRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Preview em Tempo Real
            </CardTitle>
            <div className="flex items-center gap-1">
              <Tabs value={device} onValueChange={(v) => setDevice(v as "desktop" | "mobile")}>
                <TabsList className="h-8">
                  <TabsTrigger value="desktop" className="px-2 h-6">
                    <Monitor className="w-3.5 h-3.5" />
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="px-2 h-6">
                    <Smartphone className="w-3.5 h-3.5" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" asChild>
                <a href="/" target="_blank" rel="noreferrer" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0" key={refreshKey}>
          {/* Device Frame */}
          <div className={cn(
            "mx-auto transition-all duration-300 bg-background",
            device === "mobile" ? "max-w-[280px]" : "w-full"
          )}>
            {/* Mini Browser Chrome */}
            <div className="bg-muted/80 border-t border-b border-border px-3 py-1.5 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-background/50 rounded text-[10px] px-2 py-0.5 text-muted-foreground truncate">
                seusite.com.br
              </div>
            </div>

            {/* Preview Content */}
            <div className="overflow-hidden" style={{ 
              "--preview-primary": primaryColor,
              "--preview-accent": accentColor 
            } as React.CSSProperties}>
              
              {/* Navbar Preview */}
              <div className="bg-card border-b border-border px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-6 w-auto object-contain" />
                  ) : (
                    <span className="font-display text-sm font-bold" style={{ color: primaryColor }}>
                      {brandName}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span>Home</span>
                  <span>Produtos</span>
                  <span>Sobre</span>
                </div>
              </div>

              {/* Hero Preview */}
              <div className="relative h-36 overflow-hidden">
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt="Hero"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div 
                    className="absolute inset-0" 
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}30)` 
                    }} 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-4">
                  <h3 className="font-display text-base font-bold leading-tight text-foreground">
                    {heroTitle}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {heroSubtitle}
                  </p>
                  <button 
                    className="mt-2 inline-flex items-center rounded-md px-3 py-1.5 text-[11px] font-medium text-white w-fit"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {heroCtaText}
                  </button>
                </div>
              </div>

              {/* Benefits Preview */}
              {benefitsEnabled && benefits.length > 0 && (
                <div className="px-3 py-3 bg-muted/30 border-y border-border">
                  <div className={cn(
                    "grid gap-2",
                    device === "mobile" ? "grid-cols-1" : "grid-cols-3"
                  )}>
                    {benefits.slice(0, 3).map((b: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="rounded-lg bg-card border border-border p-2 flex items-center gap-2"
                      >
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px]"
                          style={{ backgroundColor: primaryColor }}
                        >
                          ✓
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate">
                            {getString(b?.title, "Benefício")}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {getString(b?.description, "")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section Preview */}
              <div className="px-3 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold">Destaques</span>
                  <span className="text-[10px]" style={{ color: primaryColor }}>Ver todos →</span>
                </div>
                <div className={cn(
                  "grid gap-2",
                  device === "mobile" ? "grid-cols-2" : "grid-cols-4"
                )}>
                  {[1, 2, 3, 4].slice(0, device === "mobile" ? 2 : 4).map((i) => (
                    <div key={i} className="rounded-lg border border-border overflow-hidden bg-card">
                      <div className="aspect-square bg-muted/50" />
                      <div className="p-2">
                        <div className="h-2 bg-muted rounded w-3/4 mb-1" />
                        <div className="h-2 rounded w-1/2" style={{ backgroundColor: `${primaryColor}40` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Preview */}
              <div className="bg-card border-t border-border px-3 py-3">
                <div className={cn(
                  "grid gap-3",
                  device === "mobile" ? "grid-cols-1" : "grid-cols-3"
                )}>
                  <div>
                    <span className="font-display text-[11px] font-bold" style={{ color: primaryColor }}>
                      {brandName}
                    </span>
                    {tagline && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{tagline}</p>
                    )}
                    {footerAbout && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{footerAbout}</p>
                    )}
                  </div>
                  
                  {footerLinks.length > 0 && device === "desktop" && (
                    <div>
                      <p className="text-[10px] font-medium mb-1">Links</p>
                      <div className="space-y-0.5">
                        {footerLinks.slice(0, 3).map((link: any, idx: number) => (
                          <p key={idx} className="text-[10px] text-muted-foreground">
                            {getString(link?.label, "")}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {device === "desktop" && (
                    <div>
                      <p className="text-[10px] font-medium mb-1">Contato</p>
                      <div className="space-y-0.5 text-[10px] text-muted-foreground">
                        {phone && <p>{phone}</p>}
                        {email && <p>{email}</p>}
                        {(instagram || facebook) && (
                          <div className="flex gap-2 mt-1">
                            {instagram && <span>📷</span>}
                            {facebook && <span>📘</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {footerCopyright && (
                  <p className="text-[9px] text-muted-foreground text-center mt-2 pt-2 border-t border-border">
                    {footerCopyright}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Preview */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium mb-2">Cores Ativas</p>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-md border shadow-sm" 
                style={{ backgroundColor: primaryColor }} 
              />
              <span className="text-xs text-muted-foreground">Primária</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-md border shadow-sm" 
                style={{ backgroundColor: accentColor }} 
              />
              <span className="text-xs text-muted-foreground">Destaque</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}