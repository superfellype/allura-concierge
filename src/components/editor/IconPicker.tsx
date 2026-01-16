import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const POPULAR_ICONS = [
  "Sparkles", "Heart", "Star", "Gift", "ShoppingBag", "Truck", "Shield",
  "Award", "Crown", "Gem", "Leaf", "Flower2", "Sun", "Moon", "Zap",
  "Package", "CreditCard", "BadgeCheck", "Percent", "Timer", "Clock",
  "MapPin", "Phone", "Mail", "MessageCircle", "ThumbsUp", "Check",
  "ArrowRight", "ChevronRight", "ExternalLink", "Download", "Upload",
  "Share2", "Lock", "Unlock", "Eye", "Settings", "User", "Users",
];

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export default function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    if (!search) return POPULAR_ICONS;
    return POPULAR_ICONS.filter((name) =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const CurrentIcon = value && (LucideIcons as any)[value] 
    ? (LucideIcons as any)[value] 
    : LucideIcons.Sparkles;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-foreground">{label}</label>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all",
          isOpen
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40"
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <CurrentIcon className="w-4 h-4 text-primary" />
        </div>
        <span className="flex-1 text-left text-sm">{value || "Selecionar ícone"}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-secondary/50 rounded-xl border border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ícone..."
                  className="pl-9 h-9"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                {filteredIcons.map((iconName) => {
                  const IconComponent = (LucideIcons as any)[iconName];
                  if (!IconComponent) return null;

                  const isSelected = value === iconName;

                  return (
                    <button
                      key={iconName}
                      onClick={() => {
                        onChange(iconName);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      )}
                      title={iconName}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              {filteredIcons.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-4">
                  Nenhum ícone encontrado
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
