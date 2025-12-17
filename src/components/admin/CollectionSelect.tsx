import { useEffect, useState } from "react";
import { Check, X, Sparkles, Loader2, Calendar } from "lucide-react";
import { collectionsService, Collection } from "@/services/collections.service";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CollectionSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const CollectionSelect = ({ selectedIds, onChange }: CollectionSelectProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    const { data } = await collectionsService.getAll();
    setCollections(data || []);
    setLoading(false);
  };

  const toggleCollection = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(cid => cid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedCollections = collections.filter(c => selectedIds.includes(c.id));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="font-body text-sm">Carregando coleções...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      {selectedCollections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCollections.map(col => (
            <span
              key={col.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/30 text-accent-foreground text-sm font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {col.name}
              <button
                type="button"
                onClick={() => toggleCollection(col.id)}
                className="hover:bg-accent/50 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Collection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {collections.map(col => {
          const isSelected = selectedIds.includes(col.id);
          const hasDateRange = col.start_date || col.end_date;
          
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => toggleCollection(col.id)}
              className={`
                flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                ${isSelected 
                  ? 'bg-accent/20 border-accent/40 ring-1 ring-accent/40' 
                  : 'bg-secondary/50 hover:bg-secondary/80 border-transparent'
                }
                border
              `}
            >
              <div className={`
                w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors mt-0.5
                ${isSelected ? 'bg-accent border-accent' : 'border-border'}
              `}>
                {isSelected && <Check className="w-3 h-3 text-accent-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm font-medium truncate">{col.name}</span>
                  {col.highlight_on_home && (
                    <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  )}
                </div>
                {hasDateRange && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {col.start_date && format(new Date(col.start_date), "dd/MM", { locale: ptBR })}
                      {col.start_date && col.end_date && " - "}
                      {col.end_date && format(new Date(col.end_date), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {collections.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="font-body text-sm">Nenhuma coleção cadastrada</p>
          <p className="font-body text-xs mt-1">Crie coleções em Coleções</p>
        </div>
      )}

      {/* Helper Text */}
      <p className="font-body text-xs text-muted-foreground">
        <strong>Coleções</strong> são agrupamentos editoriais/temporais (ex: Verão 2025, Essentials, Lançamentos)
      </p>
    </div>
  );
};

export default CollectionSelect;
