import { motion } from "framer-motion";
import { ShoppingCart, Instagram, Facebook, Twitter, Mail, ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { EditorState, EditorElementType } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";

interface EditorCanvasProps {
  state: EditorState;
  selectedElement: EditorElementType | null;
  onSelectElement: (element: EditorElementType) => void;
  previewDevice: "desktop" | "mobile";
  isDarkMode: boolean;
  elementOrder: EditorElementType[];
}

function SelectableWrapper({
  elementId,
  selectedElement,
  onSelect,
  children,
  className,
}: {
  elementId: EditorElementType;
  selectedElement: EditorElementType | null;
  onSelect: (id: EditorElementType) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const isSelected = selectedElement === elementId;
  
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(elementId);
      }}
      className={cn(
        "relative cursor-pointer transition-all",
        "outline-2 outline-offset-2 outline-dashed outline-transparent",
        "hover:outline-primary/40",
        isSelected && "outline-primary ring-2 ring-primary/20",
        className
      )}
    >
      {isSelected && (
        <div className="absolute -top-6 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded z-10">
          {elementId}
        </div>
      )}
      {children}
    </div>
  );
}

function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) return <LucideIcons.Sparkles className={className} style={style} />;
  return <IconComponent className={className} style={style} />;
}

export default function EditorCanvas({
  state,
  selectedElement,
  onSelectElement,
  previewDevice,
  isDarkMode,
  elementOrder,
}: EditorCanvasProps) {
  const { navbar, hero, products, footer, theme, benefits, newsletter, banner } = state;

  const containerStyles: React.CSSProperties = {
    fontFamily: `'${theme.fontBody}', sans-serif`,
    backgroundColor: isDarkMode ? "#0a0a0a" : theme.backgroundColor,
    color: isDarkMode ? "#fafafa" : theme.textColor,
    borderRadius: `${theme.borderRadius}px`,
  };

  const renderElement = (elementId: EditorElementType) => {
    switch (elementId) {
      case "banner":
        if (!banner.enabled) return null;
        return (
          <SelectableWrapper
            key="banner"
            elementId="banner"
            selectedElement={selectedElement}
            onSelect={onSelectElement}
          >
            <div
              className="px-4 py-2 text-center text-sm flex items-center justify-center gap-2"
              style={{
                backgroundColor: banner.backgroundColor,
                color: banner.textColor,
              }}
            >
              <span>{banner.text}</span>
              {banner.linkText && (
                <span className="font-medium underline cursor-pointer">
                  {banner.linkText}
                </span>
              )}
            </div>
          </SelectableWrapper>
        );

      case "navbar":
        return (
          <SelectableWrapper
            key="navbar"
            elementId="navbar"
            selectedElement={selectedElement}
            onSelect={onSelectElement}
          >
            <nav
              className="px-6 py-4 flex items-center justify-between border-b"
              style={{
                backgroundColor: navbar.backgroundColor,
                borderColor: isDarkMode ? "#222" : "#eee",
              }}
            >
              <div className="flex items-center gap-3">
                {navbar.logoUrl ? (
                  <img src={navbar.logoUrl} alt="" className="h-8 object-contain" />
                ) : (
                  <span
                    className="text-xl font-bold"
                    style={{ 
                      fontFamily: `'${theme.fontDisplay}', serif`,
                      color: theme.primaryColor 
                    }}
                  >
                    {navbar.brandName}
                  </span>
                )}
              </div>
              <div 
                className="flex items-center gap-6 text-sm"
                style={{ color: navbar.textColor }}
              >
                <span className="hover:opacity-70 cursor-pointer">Produtos</span>
                <span className="hover:opacity-70 cursor-pointer">Sobre</span>
                <span className="hover:opacity-70 cursor-pointer">Contato</span>
                {navbar.showCart && (
                  <ShoppingCart className="w-5 h-5 cursor-pointer hover:opacity-70" />
                )}
              </div>
            </nav>
          </SelectableWrapper>
        );

      case "hero":
        return (
          <SelectableWrapper
            key="hero"
            elementId="hero"
            selectedElement={selectedElement}
            onSelect={onSelectElement}
          >
            <section
              className="relative overflow-hidden"
              style={{
                minHeight: previewDevice === "mobile" ? "300px" : `${hero.minHeight || 450}px`,
                backgroundColor: hero.backgroundType === "color" ? hero.backgroundColor : undefined,
                background: hero.backgroundType === "gradient" ? hero.backgroundGradient : undefined,
              }}
            >
              {hero.backgroundType === "image" && hero.backgroundImage && (
                <>
                  <img
                    src={hero.backgroundImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: `rgba(0,0,0,${hero.overlayOpacity / 100})` }}
                  />
                </>
              )}
              <div
                className={cn(
                  "relative z-10 h-full min-h-[inherit] flex flex-col justify-center p-8",
                  hero.alignment === "left" && "items-start text-left",
                  hero.alignment === "center" && "items-center text-center",
                  hero.alignment === "right" && "items-end text-right"
                )}
              >
                <h1
                  className="text-3xl md:text-5xl font-bold mb-4 max-w-2xl"
                  style={{ 
                    fontFamily: `'${theme.fontDisplay}', serif`,
                    color: hero.textColor 
                  }}
                >
                  {hero.title}
                </h1>
                <p
                  className="text-lg mb-6 opacity-80 max-w-xl"
                  style={{ color: hero.textColor }}
                >
                  {hero.subtitle}
                </p>
                <button
                  className="px-6 py-3 font-medium transition-transform hover:scale-105"
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: "#ffffff",
                    borderRadius: `${theme.borderRadius}px`,
                  }}
                >
                  {hero.ctaText}
                </button>
              </div>
            </section>
          </SelectableWrapper>
        );

      case "benefits":
        if (!benefits.enabled) return null;
        return (
          <SelectableWrapper
            key="benefits"
            elementId="benefits"
            selectedElement={selectedElement}
            onSelect={onSelectElement}
          >
            <section className="py-12 px-6" style={{ backgroundColor: benefits.backgroundColor }}>
              {benefits.title && (
                <h2
                  className="text-2xl font-bold mb-8 text-center"
                  style={{ fontFamily: `'${theme.fontDisplay}', serif` }}
                >
                  {benefits.title}
                </h2>
              )}
              <div className={cn(
                "grid gap-6",
                previewDevice === "mobile" ? "grid-cols-1" : `grid-cols-${benefits.columns}`
              )}>
                {benefits.items.map((item, i) => (
                  <div key={i} className="text-center p-4">
                    <div 
                      className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${theme.primaryColor}20` }}
                    >
                      <DynamicIcon name={item.icon} className="w-5 h-5" style={{ color: theme.primaryColor }} />
                    </div>
                    <h3 
                      className="font-semibold mb-1"
                      style={{ fontFamily: `'${theme.fontDisplay}', serif` }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm opacity-70">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </SelectableWrapper>
        );

      case "products":
        return (
          <SelectableWrapper
            key="products"
            elementId="products"
            selectedElement={selectedElement}
            onSelect={onSelectElement}
          >
            <section className="py-12 px-6" style={{ backgroundColor: products.backgroundColor }}>
              <h2
                className="text-2xl font-bold mb-8 text-center"
                style={{ fontFamily: `'${theme.fontDisplay}', serif` }}
              >
                {products.title}
              </h2>
              <div className={cn(
                "grid gap-4",
                previewDevice === "mobile" 
                  ? "grid-cols-2" 
                  : `grid-cols-${products.columns}`
              )}>
                {Array.from({ length: Math.min(products.maxItems, previewDevice === "mobile" ? 4 : 8) }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden"
                    style={{ borderRadius: `${theme.borderRadius}px` }}
                  >
                    <div
                      className="aspect-square"
                      style={{ backgroundColor: `${theme.accentColor}40` }}
                    />
                    <div className="p-3" style={{ backgroundColor: navbar.backgroundColor }}>
                      <div 
                        className="h-3 rounded mb-2"
                        style={{ backgroundColor: `${theme.textColor}20`, width: "80%" }}
                      />
                      <div 
                        className="h-3 rounded"
                        style={{ backgroundColor: theme.primaryColor, width: "50%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </SelectableWrapper>
        );

      case "newsletter":
        if (!newsletter.enabled) return null;
        return (
          <SelectableWrapper
            key="newsletter"
            elementId="newsletter"
            selectedElement={selectedElement}
            onSelect={onSelectElement}
          >
            <section
              className="py-16 px-6"
              style={{
                backgroundColor: newsletter.backgroundColor,
                color: newsletter.textColor,
              }}
            >
              <div className="max-w-xl mx-auto text-center">
                <Mail className="w-10 h-10 mx-auto mb-4 opacity-60" />
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: `'${theme.fontDisplay}', serif` }}
                >
                  {newsletter.title}
                </h2>
                <p className="opacity-70 mb-6">{newsletter.subtitle}</p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-inherit placeholder:opacity-50"
                  />
                  <button
                    className="px-6 py-3 font-medium flex items-center gap-2"
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: "#ffffff",
                      borderRadius: `${theme.borderRadius}px`,
                    }}
                  >
                    {newsletter.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </SelectableWrapper>
        );

      case "footer":
        return (
          <SelectableWrapper
            key="footer"
            elementId="footer"
            selectedElement={selectedElement}
            onSelect={onSelectElement}
          >
            <footer
              className="px-6 py-12"
              style={{
                backgroundColor: footer.backgroundColor,
                color: footer.textColor,
              }}
            >
              <div className={cn(
                "grid gap-8",
                previewDevice === "mobile" ? "grid-cols-1" : "grid-cols-3"
              )}>
                <div>
                  <span
                    className="text-xl font-bold block mb-4"
                    style={{ 
                      fontFamily: `'${theme.fontDisplay}', serif`,
                      color: theme.primaryColor 
                    }}
                  >
                    {navbar.brandName}
                  </span>
                  <p className="text-sm opacity-70">{footer.aboutText}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Links</h4>
                  <div className="space-y-2 text-sm opacity-70">
                    {footer.links.map((link, i) => (
                      <div key={i} className="hover:opacity-100 cursor-pointer">
                        {link.label}
                      </div>
                    ))}
                  </div>
                </div>
                {footer.showSocial && (
                  <div>
                    <h4 className="font-semibold mb-4">Redes Sociais</h4>
                    <div className="flex gap-4">
                      <Instagram className="w-5 h-5 opacity-70 hover:opacity-100 cursor-pointer" />
                      <Facebook className="w-5 h-5 opacity-70 hover:opacity-100 cursor-pointer" />
                      <Twitter className="w-5 h-5 opacity-70 hover:opacity-100 cursor-pointer" />
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm opacity-50">
                {footer.copyright}
              </div>
            </footer>
          </SelectableWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-auto p-4 flex justify-center">
      <motion.div
        layout
        className={cn(
          "shadow-2xl overflow-hidden transition-all duration-300",
          previewDevice === "mobile" ? "w-[375px]" : "w-full max-w-5xl"
        )}
        style={containerStyles}
      >
        {elementOrder.map((elementId) => renderElement(elementId))}
      </motion.div>
    </div>
  );
}
