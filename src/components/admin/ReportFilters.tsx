import { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'search';
  options?: FilterOption[];
  placeholder?: string;
}

interface ReportFiltersProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onClear: () => void;
  resultCount?: number;
}

export function ReportFilters({
  filters,
  values,
  onChange,
  onClear,
  resultCount,
}: ReportFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activeFiltersCount = Object.entries(values).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== '' && value !== 'all';
  }).length;

  const searchFilter = filters.find(f => f.type === 'search');
  const selectFilters = filters.filter(f => f.type === 'select');
  const multiselectFilters = filters.filter(f => f.type === 'multiselect');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        {searchFilter && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchFilter.placeholder || "Buscar..."}
              value={values[searchFilter.key] || ''}
              onChange={(e) => onChange(searchFilter.key, e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Quick select filters */}
        {selectFilters.map((filter) => (
          <Select
            key={filter.key}
            value={values[filter.key] || 'all'}
            onValueChange={(v) => onChange(filter.key, v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {filter.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Advanced filters */}
        {multiselectFilters.length > 0 && (
          <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filtros Avançados</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-7 text-xs"
                  >
                    Limpar tudo
                  </Button>
                </div>

                <Separator />

                {multiselectFilters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      {filter.label}
                    </Label>
                    <ScrollArea className="h-[120px]">
                      <div className="space-y-2 pr-4">
                        {filter.options?.map((opt) => {
                          const currentValues = values[filter.key] || [];
                          const isChecked = currentValues.includes(opt.value);
                          return (
                            <div key={opt.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${filter.key}-${opt.value}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  const newValues = checked
                                    ? [...currentValues, opt.value]
                                    : currentValues.filter((v: string) => v !== opt.value);
                                  onChange(filter.key, newValues);
                                }}
                              />
                              <Label
                                htmlFor={`${filter.key}-${opt.value}`}
                                className="text-sm cursor-pointer"
                              >
                                {opt.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-1 text-muted-foreground"
          >
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active filters badges */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {resultCount !== undefined && (
            <span className="text-sm text-muted-foreground">
              {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
            </span>
          )}
          {Object.entries(values).map(([key, value]) => {
            if (!value || value === 'all' || (Array.isArray(value) && value.length === 0)) return null;
            
            const filter = filters.find(f => f.key === key);
            if (!filter) return null;

            if (Array.isArray(value)) {
              return value.map((v: string) => {
                const opt = filter.options?.find(o => o.value === v);
                return (
                  <Badge key={`${key}-${v}`} variant="secondary" className="gap-1">
                    {opt?.label || v}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => onChange(key, value.filter((x: string) => x !== v))}
                    />
                  </Badge>
                );
              });
            }

            const opt = filter.options?.find(o => o.value === value);
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {filter.label}: {opt?.label || value}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => onChange(key, 'all')}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
