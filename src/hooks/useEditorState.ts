import { useState, useCallback, useMemo } from "react";

export type EditorElementType = 
  | "navbar" 
  | "hero" 
  | "benefits" 
  | "products" 
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
}

export interface ProductsConfig {
  title: string;
  layout: "grid" | "carousel";
  columns: 2 | 3 | 4;
  showFeaturedOnly: boolean;
  maxItems: number;
  backgroundColor: string;
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
  },
  products: {
    title: "Destaques",
    layout: "grid",
    columns: 4,
    showFeaturedOnly: true,
    maxItems: 8,
    backgroundColor: "#faf8f5",
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

  const elements: EditorElement[] = useMemo(() => [
    { id: "navbar", label: "Navegação", visible: true },
    { id: "hero", label: "Hero", visible: true },
    { id: "benefits", label: "Benefícios", visible: true },
    { id: "products", label: "Produtos", visible: true },
    { id: "footer", label: "Rodapé", visible: true },
  ], []);

  const pushHistory = useCallback((newState: EditorState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ state: newState, timestamp: Date.now() });
      return newHistory.slice(-50); // Keep last 50 entries
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

  const loadFromSettings = useCallback((settings: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        brandName: settings.brand_name || prev.navbar.brandName,
        logoUrl: settings.logo_url || prev.navbar.logoUrl,
      },
      hero: {
        ...prev.hero,
        title: settings.hero_title || prev.hero.title,
        subtitle: settings.hero_subtitle || prev.hero.subtitle,
        ctaText: settings.hero_cta_text || prev.hero.ctaText,
        backgroundImage: settings.hero_image_url || prev.hero.backgroundImage,
      },
      theme: {
        ...prev.theme,
        primaryColor: settings.primary_color || prev.theme.primaryColor,
        accentColor: settings.accent_color || prev.theme.accentColor,
      },
    }));
    setIsDirty(false);
  }, []);

  const getPublishPayload = useCallback(() => {
    return {
      brand_name: state.navbar.brandName,
      logo_url: state.navbar.logoUrl,
      hero_title: state.hero.title,
      hero_subtitle: state.hero.subtitle,
      hero_cta_text: state.hero.ctaText,
      hero_image_url: state.hero.backgroundImage,
      primary_color: state.theme.primaryColor,
      accent_color: state.theme.accentColor,
    };
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
  };
}
