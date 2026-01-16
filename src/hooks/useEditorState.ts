import { useState, useCallback, useMemo } from "react";

export type EditorElementType = 
  | "navbar" 
  | "hero" 
  | "benefits" 
  | "products" 
  | "newsletter"
  | "banner"
  | "footer";

export interface EditorElement {
  id: EditorElementType;
  label: string;
  visible: boolean;
}

export interface NavbarConfig {
  brandName: string;
  logoUrl: string;
  backgroundColor: string;
  textColor: string;
  showCart: boolean;
  sticky: boolean;
}

export interface HeroConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  backgroundType: "color" | "image" | "gradient";
  backgroundColor: string;
  backgroundImage: string;
  backgroundGradient: string;
  overlayOpacity: number;
  textColor: string;
  alignment: "left" | "center" | "right";
  minHeight: number;
  animation: "none" | "fade" | "slide" | "zoom";
}

export interface BenefitItem {
  icon: string;
  title: string;
  description: string;
}

export interface BenefitsConfig {
  title: string;
  items: BenefitItem[];
  backgroundColor: string;
  columns: 3 | 4;
  enabled: boolean;
}

export interface ProductsConfig {
  title: string;
  layout: "grid" | "carousel";
  columns: 2 | 3 | 4;
  showFeaturedOnly: boolean;
  maxItems: number;
  backgroundColor: string;
}

export interface NewsletterConfig {
  title: string;
  subtitle: string;
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  enabled: boolean;
}

export interface BannerConfig {
  text: string;
  linkText: string;
  linkUrl: string;
  backgroundColor: string;
  textColor: string;
  enabled: boolean;
}

export interface FooterConfig {
  aboutText: string;
  copyright: string;
  showSocial: boolean;
  backgroundColor: string;
  textColor: string;
  links: { label: string; url: string }[];
}

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontDisplay: string;
  fontBody: string;
}

export interface EditorState {
  navbar: NavbarConfig;
  hero: HeroConfig;
  benefits: BenefitsConfig;
  products: ProductsConfig;
  newsletter: NewsletterConfig;
  banner: BannerConfig;
  footer: FooterConfig;
  theme: ThemeConfig;
}

const DEFAULT_STATE: EditorState = {
  navbar: {
    brandName: "Allura",
    logoUrl: "",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    showCart: true,
    sticky: true,
  },
  hero: {
    title: "Elegância que conta histórias",
    subtitle: "Bolsas artesanais com design atemporal",
    ctaText: "Ver Coleção",
    ctaUrl: "/produtos",
    backgroundType: "gradient",
    backgroundColor: "#f5f0e8",
    backgroundImage: "",
    backgroundGradient: "linear-gradient(135deg, #f5f0e8 0%, #e8dfd0 100%)",
    overlayOpacity: 0,
    textColor: "#1a1a1a",
    alignment: "center",
    minHeight: 600,
    animation: "fade",
  },
  benefits: {
    title: "Por que escolher a Allura?",
    items: [
      { icon: "Sparkles", title: "Qualidade Premium", description: "Materiais selecionados" },
      { icon: "Truck", title: "Frete Grátis", description: "Em compras acima de R$299" },
      { icon: "Shield", title: "Garantia", description: "1 ano de garantia" },
    ],
    backgroundColor: "#ffffff",
    columns: 3,
    enabled: true,
  },
  products: {
    title: "Destaques",
    layout: "grid",
    columns: 4,
    showFeaturedOnly: true,
    maxItems: 8,
    backgroundColor: "#faf8f5",
  },
  newsletter: {
    title: "Receba novidades exclusivas",
    subtitle: "Seja a primeira a conhecer novas coleções",
    buttonText: "Inscrever",
    backgroundColor: "#1a1a1a",
    textColor: "#ffffff",
    enabled: true,
  },
  banner: {
    text: "Frete grátis em compras acima de R$ 299",
    linkText: "Aproveite →",
    linkUrl: "/produtos",
    backgroundColor: "#b87d4b",
    textColor: "#ffffff",
    enabled: false,
  },
  footer: {
    aboutText: "Allura - Bolsas e acessórios de luxo com design brasileiro.",
    copyright: "© 2024 Allura. Todos os direitos reservados.",
    showSocial: true,
    backgroundColor: "#1a1a1a",
    textColor: "#ffffff",
    links: [
      { label: "Sobre", url: "/sobre" },
      { label: "Contato", url: "/contato" },
      { label: "Termos", url: "/termos" },
    ],
  },
  theme: {
    primaryColor: "#b87d4b",
    accentColor: "#d4b896",
    backgroundColor: "#faf8f5",
    textColor: "#1a1a1a",
    borderRadius: 16,
    fontDisplay: "Playfair Display",
    fontBody: "Inter",
  },
};

interface HistoryEntry {
  state: EditorState;
  timestamp: number;
}

export function useEditorState() {
  const [state, setState] = useState<EditorState>(DEFAULT_STATE);
  const [selectedElement, setSelectedElement] = useState<EditorElementType | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([{ state: DEFAULT_STATE, timestamp: Date.now() }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [elementOrder, setElementOrder] = useState<EditorElementType[]>([
    "banner", "navbar", "hero", "benefits", "products", "newsletter", "footer"
  ]);

  const elements: EditorElement[] = useMemo(() => [
    { id: "banner", label: "Banner", visible: state.banner.enabled },
    { id: "navbar", label: "Navegação", visible: true },
    { id: "hero", label: "Hero", visible: true },
    { id: "benefits", label: "Benefícios", visible: state.benefits.enabled },
    { id: "products", label: "Produtos", visible: true },
    { id: "newsletter", label: "Newsletter", visible: state.newsletter.enabled },
    { id: "footer", label: "Rodapé", visible: true },
  ], [state.banner.enabled, state.benefits.enabled, state.newsletter.enabled]);

  const pushHistory = useCallback((newState: EditorState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ state: newState, timestamp: Date.now() });
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const updateElement = useCallback(<T extends EditorElementType>(
    elementId: T,
    updates: Partial<EditorState[T]>
  ) => {
    setState(prev => {
      const newState = {
        ...prev,
        [elementId]: { ...prev[elementId], ...updates },
      };
      pushHistory(newState);
      return newState;
    });
    setIsDirty(true);
  }, [pushHistory]);

  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setState(prev => {
      const newState = {
        ...prev,
        theme: { ...prev.theme, ...updates },
      };
      pushHistory(newState);
      return newState;
    });
    setIsDirty(true);
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex].state);
      setIsDirty(true);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setState(history[newIndex].state);
      setIsDirty(true);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const resetToDefault = useCallback(() => {
    setState(DEFAULT_STATE);
    setIsDirty(true);
    pushHistory(DEFAULT_STATE);
  }, [pushHistory]);

  const reorderElements = useCallback((activeId: string, overId: string) => {
    setElementOrder(prev => {
      const oldIndex = prev.indexOf(activeId as EditorElementType);
      const newIndex = prev.indexOf(overId as EditorElementType);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newOrder = [...prev];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);
      
      return newOrder;
    });
    setIsDirty(true);
  }, []);

  const loadFromSettings = useCallback((settings: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        brandName: settings.brand_name || prev.navbar.brandName,
        logoUrl: settings.logo_url || prev.navbar.logoUrl,
        backgroundColor: settings.navbar_bg_color || prev.navbar.backgroundColor,
        textColor: settings.navbar_text_color || prev.navbar.textColor,
      },
      hero: {
        ...prev.hero,
        title: settings.hero_title || prev.hero.title,
        subtitle: settings.hero_subtitle || prev.hero.subtitle,
        ctaText: settings.hero_cta_text || prev.hero.ctaText,
        ctaUrl: settings.hero_cta_link || prev.hero.ctaUrl,
        backgroundImage: settings.hero_image_url || prev.hero.backgroundImage,
        backgroundColor: settings.hero_bg_color || prev.hero.backgroundColor,
        textColor: settings.hero_text_color || prev.hero.textColor,
      },
      benefits: {
        ...prev.benefits,
        enabled: settings.benefits_enabled ?? prev.benefits.enabled,
        backgroundColor: settings.benefits_bg_color || prev.benefits.backgroundColor,
      },
      products: {
        ...prev.products,
        title: settings.featured_products_title || prev.products.title,
        maxItems: settings.featured_products_limit || prev.products.maxItems,
        backgroundColor: settings.products_bg_color || prev.products.backgroundColor,
      },
      newsletter: {
        ...prev.newsletter,
        enabled: settings.newsletter_enabled ?? prev.newsletter.enabled,
        title: settings.newsletter_title || prev.newsletter.title,
        subtitle: settings.newsletter_subtitle || prev.newsletter.subtitle,
        buttonText: settings.newsletter_button_text || prev.newsletter.buttonText,
        backgroundColor: settings.newsletter_bg_color || prev.newsletter.backgroundColor,
      },
      banner: {
        ...prev.banner,
        enabled: settings.banner_enabled ?? prev.banner.enabled,
        text: settings.banner_text || prev.banner.text,
        backgroundColor: settings.banner_bg_color || prev.banner.backgroundColor,
      },
      footer: {
        ...prev.footer,
        aboutText: settings.footer_about_text || prev.footer.aboutText,
        copyright: settings.footer_copyright || prev.footer.copyright,
        backgroundColor: settings.footer_bg_color || prev.footer.backgroundColor,
        textColor: settings.footer_text_color || prev.footer.textColor,
      },
      theme: {
        ...prev.theme,
        primaryColor: settings.primary_color || prev.theme.primaryColor,
        accentColor: settings.accent_color || prev.theme.accentColor,
        backgroundColor: settings.background_color || prev.theme.backgroundColor,
        borderRadius: settings.border_radius ?? prev.theme.borderRadius,
        fontDisplay: settings.font_display || prev.theme.fontDisplay,
        fontBody: settings.font_body || prev.theme.fontBody,
      },
    }));

    // Load element order if exists
    if (settings.sections_order && Array.isArray(settings.sections_order)) {
      setElementOrder(settings.sections_order as EditorElementType[]);
    }

    setIsDirty(false);
  }, []);

  const getPublishPayload = useCallback(() => {
    return {
      // Navbar
      brand_name: state.navbar.brandName,
      logo_url: state.navbar.logoUrl,
      navbar_bg_color: state.navbar.backgroundColor,
      navbar_text_color: state.navbar.textColor,
      
      // Hero
      hero_title: state.hero.title,
      hero_subtitle: state.hero.subtitle,
      hero_cta_text: state.hero.ctaText,
      hero_cta_link: state.hero.ctaUrl,
      hero_image_url: state.hero.backgroundImage,
      hero_bg_color: state.hero.backgroundColor,
      hero_text_color: state.hero.textColor,
      
      // Benefits
      benefits_enabled: state.benefits.enabled,
      benefits_bg_color: state.benefits.backgroundColor,
      benefits: state.benefits.items,
      
      // Products
      featured_products_title: state.products.title,
      featured_products_limit: state.products.maxItems,
      products_bg_color: state.products.backgroundColor,
      
      // Newsletter
      newsletter_enabled: state.newsletter.enabled,
      newsletter_title: state.newsletter.title,
      newsletter_subtitle: state.newsletter.subtitle,
      newsletter_button_text: state.newsletter.buttonText,
      newsletter_bg_color: state.newsletter.backgroundColor,
      
      // Banner
      banner_enabled: state.banner.enabled,
      banner_text: state.banner.text,
      banner_bg_color: state.banner.backgroundColor,
      
      // Footer
      footer_about_text: state.footer.aboutText,
      footer_copyright: state.footer.copyright,
      footer_bg_color: state.footer.backgroundColor,
      footer_text_color: state.footer.textColor,
      
      // Theme
      primary_color: state.theme.primaryColor,
      accent_color: state.theme.accentColor,
      background_color: state.theme.backgroundColor,
      border_radius: state.theme.borderRadius,
      font_display: state.theme.fontDisplay,
      font_body: state.theme.fontBody,
      
      // Order
      sections_order: elementOrder,
    };
  }, [state, elementOrder]);

  // Save draft to localStorage for preview
  const saveDraft = useCallback(() => {
    localStorage.setItem("editor-draft", JSON.stringify(state));
  }, [state]);

  return {
    state,
    elements,
    selectedElement,
    setSelectedElement,
    isDirty,
    setIsDirty,
    updateElement,
    updateTheme,
    undo,
    redo,
    canUndo,
    canRedo,
    resetToDefault,
    loadFromSettings,
    getPublishPayload,
    previewDevice,
    setPreviewDevice,
    isDarkMode,
    setIsDarkMode,
    elementOrder,
    reorderElements,
    saveDraft,
    history,
    historyIndex,
  };
}
