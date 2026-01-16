import { useState, useMemo } from "react";
import { Download, Check, X, ChevronDown, FileSpreadsheet, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { exportToCSV } from "@/lib/export-utils";
import { toast } from "sonner";

export interface ExportColumn {
  key: string;
  label: string;
  defaultEnabled?: boolean;
  format?: (value: any) => string;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  filename: string;
}

export function ExportModal({
  open,
  onOpenChange,
  title,
  description,
  columns,
  data,
  filename,
}: ExportModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(() => {
    return new Set(
      columns.filter(c => c.defaultEnabled !== false).map(c => c.key)
    );
  });

  const allSelected = selectedColumns.size === columns.length;
  const noneSelected = selectedColumns.size === 0;

  const toggleColumn = (key: string) => {
    const newSet = new Set(selectedColumns);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedColumns(newSet);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(columns.map(c => c.key)));
    }
  };

  const handleExport = () => {
    if (selectedColumns.size === 0) {
      toast.error("Selecione ao menos uma coluna");
      return;
    }

    const selectedColumnsList = columns.filter(c => selectedColumns.has(c.key));
    
    const dataToExport = data.map(item => {
      const row: Record<string, any> = {};
      selectedColumnsList.forEach(col => {
        const value = item[col.key];
        row[col.label] = col.format ? col.format(value) : (value ?? '-');
      });
      return row;
    });

    exportToCSV(dataToExport, filename);
    toast.success(`${data.length} registros exportados!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedColumns.size} de {columns.length} colunas selecionadas
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="text-xs"
            >
              {allSelected ? 'Desmarcar tudo' : 'Selecionar tudo'}
            </Button>
          </div>

          <Separator />

          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-3">
                  <Checkbox
                    id={`col-${column.key}`}
                    checked={selectedColumns.has(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                  />
                  <Label
                    htmlFor={`col-${column.key}`}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    {column.label}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Prévia da exportação:</p>
            <p>{data.length} registros • {selectedColumns.size} colunas</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={noneSelected}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for export modal state
export function useExportModal() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, openModal: () => setOpen(true) };
}
