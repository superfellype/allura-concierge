import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BenefitsConfig, BenefitItem } from "@/hooks/useEditorState";
import IconPicker from "./IconPicker";

interface ColorInputProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
}

function ColorInput({ value, onChange, label }: ColorInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer overflow-hidden"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 h-10 font-mono text-xs"
        />
      </div>
    </div>
  );
}

interface BenefitsPropertiesProps {
  config: BenefitsConfig;
  onChange: (updates: Partial<BenefitsConfig>) => void;
}

export default function BenefitsProperties({
  config,
  onChange,
}: BenefitsPropertiesProps) {
  const updateItem = (index: number, updates: Partial<BenefitItem>) => {
    const newItems = [...config.items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange({ items: newItems });
  };

  const addItem = () => {
    onChange({
      items: [
        ...config.items,
        { icon: "Sparkles", title: "Novo Benefício", description: "Descrição" },
      ],
    });
  };

  const removeItem = (index: number) => {
    const newItems = config.items.filter((_, i) => i !== index);
    onChange({ items: newItems });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs">Título da Seção</Label>
        <Input
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Por que escolher..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Colunas</Label>
        <Select
          value={String(config.columns)}
          onValueChange={(v) => onChange({ columns: Number(v) as 3 | 4 })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 colunas</SelectItem>
            <SelectItem value="4">4 colunas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ColorInput
        label="Cor de Fundo"
        value={config.backgroundColor}
        onChange={(v) => onChange({ backgroundColor: v })}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Benefícios ({config.items.length})</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addItem}
            className="h-7 text-xs gap-1"
          >
            <Plus className="w-3 h-3" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {config.items.map((item, index) => (
            <div
              key={index}
              className="p-3 bg-secondary/50 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <IconPicker
                  value={item.icon}
                  onChange={(icon) => updateItem(index, { icon })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Input
                value={item.title}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                placeholder="Título"
                className="h-8 text-xs"
              />

              <Input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Descrição"
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
