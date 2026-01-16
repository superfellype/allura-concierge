import { motion } from "framer-motion";
import { 
  Navigation, Image, Gift, ShoppingBag, Mail,
  Eye, EyeOff, GripVertical, Palette
} from "lucide-react";
import { EditorElement, EditorElementType } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";

const ELEMENT_ICONS: Record<EditorElementType, React.ElementType> = {
  navbar: Navigation,
  hero: Image,
  benefits: Gift,
  products: ShoppingBag,
  footer: Mail,
};

interface LayersPanelProps {
  elements: EditorElement[];
  selectedElement: EditorElementType | null;
  onSelectElement: (element: EditorElementType | null) => void;
  onSelectTheme: () => void;
  isThemeSelected: boolean;
}

export default function LayersPanel({
  elements,
  selectedElement,
  onSelectElement,
  onSelectTheme,
  isThemeSelected,
}: LayersPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Camadas
        </h3>
        <div className="space-y-1">
          {elements.map((element, index) => {
            const Icon = ELEMENT_ICONS[element.id];
            const isSelected = selectedElement === element.id && !isThemeSelected;
            
            return (
              <motion.button
                key={element.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectElement(element.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isSelected
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-secondary text-foreground"
                )}
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 cursor-grab" />
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{element.label}</span>
                {element.visible ? (
                  <Eye className="w-3.5 h-3.5 text-muted-foreground/50" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-muted-foreground/30" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Global
        </h3>
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onSelectTheme}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
            isThemeSelected
              ? "bg-primary/10 text-primary border border-primary/20"
              : "hover:bg-secondary text-foreground"
          )}
        >
          <Palette className="w-4 h-4" />
          <span className="flex-1 text-left">Tema & Cores</span>
        </motion.button>
      </div>
    </div>
  );
}
