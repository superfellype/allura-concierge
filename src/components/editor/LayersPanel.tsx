import { motion } from "framer-motion";
import { 
  Navigation, Image, Gift, ShoppingBag, Mail,
  Eye, EyeOff, GripVertical, Palette, Megaphone, Newspaper
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditorElement, EditorElementType } from "@/hooks/useEditorState";
import { cn } from "@/lib/utils";

const ELEMENT_ICONS: Record<EditorElementType, React.ElementType> = {
  navbar: Navigation,
  hero: Image,
  benefits: Gift,
  products: ShoppingBag,
  newsletter: Newspaper,
  banner: Megaphone,
  footer: Mail,
};

interface SortableLayerProps {
  element: EditorElement;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

function SortableLayer({ element, isSelected, onSelect, index }: SortableLayerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const Icon = ELEMENT_ICONS[element.id];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
        isDragging && "shadow-lg bg-card",
        isSelected
          ? "bg-primary/10 text-primary border border-primary/20"
          : "hover:bg-secondary text-foreground"
      )}
      onClick={onSelect}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
      </div>
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{element.label}</span>
      {element.visible ? (
        <Eye className="w-3.5 h-3.5 text-muted-foreground/50" />
      ) : (
        <EyeOff className="w-3.5 h-3.5 text-muted-foreground/30" />
      )}
    </motion.div>
  );
}

interface LayersPanelProps {
  elements: EditorElement[];
  selectedElement: EditorElementType | null;
  onSelectElement: (element: EditorElementType | null) => void;
  onSelectTheme: () => void;
  isThemeSelected: boolean;
  elementOrder: EditorElementType[];
  onReorderElements: (activeId: string, overId: string) => void;
}

export default function LayersPanel({
  elements,
  selectedElement,
  onSelectElement,
  onSelectTheme,
  isThemeSelected,
  elementOrder,
  onReorderElements,
}: LayersPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      onReorderElements(active.id as string, over.id as string);
    }
  };

  // Sort elements based on elementOrder
  const sortedElements = [...elements].sort((a, b) => {
    const aIndex = elementOrder.indexOf(a.id);
    const bIndex = elementOrder.indexOf(b.id);
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Camadas
        </h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedElements.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {sortedElements.map((element, index) => (
                <SortableLayer
                  key={element.id}
                  element={element}
                  isSelected={selectedElement === element.id && !isThemeSelected}
                  onSelect={() => onSelectElement(element.id)}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
