import { useEffect, useState } from "react";
import { Check, X, Plus, Loader2 } from "lucide-react";
import { categoriesService, Category } from "@/services/categories.service";

interface CategorySelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const CategorySelect = ({ selectedIds, onChange }: CategorySelectProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await categoriesService.getAll();
    setCategories(data || []);
    setLoading(false);
  };

  const toggleCategory = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(cid => cid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedCategories = categories.filter(c => selectedIds.includes(c.id));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="font-body text-sm">Carregando categorias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map(cat => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              {cat.name}
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map(cat => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-xl text-left transition-all duration-200
                ${isSelected 
                  ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/30' 
                  : 'bg-secondary/50 hover:bg-secondary/80 border-transparent'
                }
                border
              `}
            >
              <div className={`
                w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                ${isSelected ? 'bg-primary border-primary' : 'border-border'}
              `}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span className="font-body text-sm font-medium truncate">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="font-body text-sm">Nenhuma categoria cadastrada</p>
          <p className="font-body text-xs mt-1">Crie categorias em Configurações → Categorias</p>
        </div>
      )}

      {/* Helper Text */}
      <p className="font-body text-xs text-muted-foreground">
        <strong>Categorias</strong> organizam seu catálogo em seções fixas (ex: Bolsas, Óculos, Acessórios)
      </p>
    </div>
  );
};

export default CategorySelect;
