import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const brandName = getString(settings.brand_name, "Sua marca");
  const tagline = getString(settings.brand_tagline, "");

  const heroTitle = getString(settings.hero_title, "Título do Hero");
  const heroSubtitle = getString(settings.hero_subtitle, "Subtítulo do hero");
  const heroImageUrl = getString(settings.hero_image_url, "");
  const heroCtaText = getString(settings.hero_cta_text, "Ver produtos");
  const heroCtaLink = getString(settings.hero_cta_link, "/produtos");

  const benefitsEnabled = getBoolean(settings.benefits_enabled, true);
  const benefits = Array.isArray(settings.benefits) ? settings.benefits : [];

  const footerAbout = getString(settings.footer_about_text, "");
  const footerCopyright = getString(settings.footer_copyright, "");

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-sm">Preview em tempo real</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a href="/" target="_blank" rel="noreferrer" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Abrir site
            </a>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="relative h-40">
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt="Preview do hero"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}
              <div className="absolute inset-0 bg-background/70" />
              <div className="relative p-4">
                <p className="text-xs text-muted-foreground">{brandName}</p>
                <h3 className="font-display text-lg leading-tight">{heroTitle}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{heroSubtitle}</p>
                <div className="mt-3 inline-flex items-center rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground">
                  {heroCtaText}
                </div>
                {tagline && <p className="text-[11px] text-muted-foreground mt-2">{tagline}</p>}
                {heroCtaLink && (
                  <p className="text-[11px] text-muted-foreground mt-1">Link: {heroCtaLink}</p>
                )}
              </div>
            </div>
          </div>

          {benefitsEnabled && benefits.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Benefícios</p>
              <div className="grid grid-cols-3 gap-2">
                {benefits.slice(0, 3).map((b: any, idx: number) => (
                  <div key={idx} className="rounded-lg border bg-card p-2">
                    <p className="text-[11px] font-medium line-clamp-1">{getString(b?.title, "")}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{getString(b?.description, "")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(footerAbout || footerCopyright) && (
            <div className="rounded-xl border bg-card p-3">
              <p className="text-xs font-medium">Rodapé</p>
              {footerAbout && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-3">{footerAbout}</p>}
              {footerCopyright && (
                <p className="text-[11px] text-muted-foreground mt-2">{footerCopyright}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
