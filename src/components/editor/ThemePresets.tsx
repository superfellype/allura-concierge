import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { ThemeConfig } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  borderRadius: number;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "luxo-classico",
    name: "Luxo Clássico",
    description: "Tons quentes e dourados",
    colors: {
      primary: "#b87d4b",
      accent: "#d4b896",
      background: "#faf8f5",
      text: "#1a1a1a",
    },
    fonts: { display: "Playfair Display", body: "Inter" },
    borderRadius: 16,
  },
  {
    id: "minimalista",
    name: "Minimalista",
    description: "Clean e moderno",
    colors: {
      primary: "#1a1a1a",
      accent: "#666666",
      background: "#ffffff",
      text: "#1a1a1a",
    },
    fonts: { display: "Montserrat", body: "Inter" },
    borderRadius: 8,
  },
  {
    id: "rosa-blush",
    name: "Rosa Blush",
    description: "Feminino e delicado",
    colors: {
      primary: "#d4a5a5",
      accent: "#f5e6e0",
      background: "#fffafa",
      text: "#3d2929",
    },
    fonts: { display: "Lora", body: "Poppins" },
    borderRadius: 20,
  },
  {
    id: "verde-natureza",
    name: "Verde Natureza",
    description: "Orgânico e eco",
    colors: {
      primary: "#4a7c59",
      accent: "#a3c9a8",
      background: "#f5faf5",
      text: "#1a2e1a",
    },
    fonts: { display: "Merriweather", body: "Open Sans" },
    borderRadius: 12,
  },
  {
    id: "azul-marinho",
    name: "Azul Marinho",
    description: "Sofisticado",
    colors: {
      primary: "#1e3a5f",
      accent: "#6b8cae",
      background: "#f5f8fa",
      text: "#0f1a2a",
    },
    fonts: { display: "Playfair Display", body: "Roboto" },
    borderRadius: 10,
  },
  {
    id: "terracota",
    name: "Terracota",
    description: "Rústico artesanal",
    colors: {
      primary: "#c25a3c",
      accent: "#e8c4a8",
      background: "#faf6f0",
      text: "#2a1a14",
    },
    fonts: { display: "Lora", body: "Inter" },
    borderRadius: 14,
  },
];

interface ThemePresetsProps {
  currentTheme: ThemeConfig;
  onApplyPreset: (preset: ThemePreset) => void;
}

export default function ThemePresets({
  currentTheme,
  onApplyPreset,
}: ThemePresetsProps) {
  const isPresetActive = (preset: ThemePreset) => {
    return (
      currentTheme.primaryColor === preset.colors.primary &&
      currentTheme.accentColor === preset.colors.accent
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium">Presets de Tema</h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {THEME_PRESETS.map((preset, index) => {
          const isActive = isPresetActive(preset);
          
          return (
            <motion.button
              key={preset.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onApplyPreset(preset)}
              className={cn(
                "relative text-left p-3 rounded-xl border-2 transition-all group",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-secondary/50"
              )}
            >
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}

              {/* Color Preview */}
              <div className="flex gap-1 mb-2">
                <div
                  className="w-6 h-6 rounded-full border border-border/50"
                  style={{ backgroundColor: preset.colors.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-border/50"
                  style={{ backgroundColor: preset.colors.accent }}
                />
                <div
                  className="w-6 h-6 rounded-full border border-border/50"
                  style={{ backgroundColor: preset.colors.background }}
                />
              </div>

              {/* Info */}
              <h5 className="text-sm font-medium">{preset.name}</h5>
              <p className="text-xs text-muted-foreground mt-0.5">
                {preset.description}
              </p>

              {/* Font Preview */}
              <p 
                className="text-xs mt-2 text-muted-foreground/70 truncate"
                style={{ fontFamily: `'${preset.fonts.display}', serif` }}
              >
                {preset.fonts.display}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
