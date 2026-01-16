import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { useBrands } from "@/hooks/useBrands";
import { brandsService } from "@/services/brands.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BrandSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BrandSelect({ value, onChange }: BrandSelectProps) {
  const { brands, loading, refetch } = useBrands(true);
  const [open, setOpen] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedBrand = brands.find((b) => b.name === value);

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error("Nome da marca é obrigatório");
      return;
    }

    setCreating(true);
    const { data, error } = await brandsService.create({ name: newBrandName.trim() });
    
    if (error) {
      toast.error("Erro ao criar marca");
    } else if (data) {
      toast.success("Marca criada!");
      onChange(data.name);
      await refetch();
      setShowNewDialog(false);
      setNewBrandName("");
    }
    setCreating(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 font-normal"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando...
              </span>
            ) : selectedBrand ? (
              <span className="flex items-center gap-2">
                {selectedBrand.logo_url && (
                  <img src={selectedBrand.logo_url} alt="" className="w-5 h-5 rounded object-cover" />
                )}
                {selectedBrand.name}
              </span>
            ) : (
              <span className="text-muted-foreground">Selecione uma marca...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar marca..." />
            <CommandList>
              <CommandEmpty>Nenhuma marca encontrada.</CommandEmpty>
              <CommandGroup>
                {brands.map((brand) => (
                  <CommandItem
                    key={brand.id}
                    value={brand.name}
                    onSelect={() => {
                      onChange(brand.name);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === brand.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {brand.logo_url && (
                      <img src={brand.logo_url} alt="" className="w-5 h-5 rounded object-cover" />
                    )}
                    {brand.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowNewDialog(true);
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar nova marca
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Marca</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Nome da marca</Label>
              <Input
                id="brand-name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Ex: Louis Vuitton"
                onKeyDown={(e) => e.key === "Enter" && handleCreateBrand()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBrand} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar marca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
