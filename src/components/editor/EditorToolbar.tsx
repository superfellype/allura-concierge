import { motion } from "framer-motion";
import { 
  Undo2, Redo2, Monitor, Smartphone, RotateCcw, 
  Play, Loader2, Eye, Moon, Sun 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  previewDevice: "desktop" | "mobile";
  onDeviceChange: (device: "desktop" | "mobile") => void;
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
  isDirty: boolean;
  isPublishing: boolean;
  onReset: () => void;
  onPublish: () => void;
  onPreview: () => void;
}

export default function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  previewDevice,
  onDeviceChange,
  isDarkMode,
  onDarkModeToggle,
  isDirty,
  isPublishing,
  onReset,
  onPublish,
  onPreview,
}: EditorToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-4 px-4 py-3 bg-card/80 backdrop-blur-sm border border-border rounded-2xl"
    >
      {/* Left - History */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-9 w-9"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-9 w-9"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refazer (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="h-9 w-9"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Resetar para padrão</TooltipContent>
        </Tooltip>
      </div>

      {/* Center - Device & Mode Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-secondary rounded-xl p-1">
          <button
            onClick={() => onDeviceChange("desktop")}
            className={`p-2 rounded-lg transition-all ${
              previewDevice === "desktop" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeviceChange("mobile")}
            className={`p-2 rounded-lg transition-all ${
              previewDevice === "mobile" 
                ? "bg-background shadow-sm text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onDarkModeToggle}
              className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              {isDarkMode ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {isDarkMode ? "Modo claro" : "Modo escuro"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        {isDirty && (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium animate-pulse">
            Rascunho
          </span>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              className="gap-1.5"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </TooltipTrigger>
          <TooltipContent>Abrir preview em nova aba</TooltipContent>
        </Tooltip>

        <Button
          onClick={onPublish}
          disabled={!isDirty || isPublishing}
          className="gap-1.5"
          size="sm"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Publicar
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
