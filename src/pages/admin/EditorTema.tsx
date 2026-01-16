import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import EditorToolbar from "@/components/editor/EditorToolbar";
import EditorCanvas from "@/components/editor/EditorCanvas";
import LayersPanel from "@/components/editor/LayersPanel";
import PropertiesPanel from "@/components/editor/PropertiesPanel";
import { useEditorState } from "@/hooks/useEditorState";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "sonner";

export default function EditorTema() {
  const { settings, loading: settingsLoading, updateMultiple } = useSiteSettings();
  const editor = useEditorState();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isThemeSelected, setIsThemeSelected] = useState(false);

  useEffect(() => {
    if (!settingsLoading && settings) {
      editor.loadFromSettings(settings);
    }
  }, [settingsLoading, settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? editor.redo() : editor.undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        e.preventDefault();
        editor.redo();
      }
      if (e.key === "Escape") {
        editor.setSelectedElement(null);
        setIsThemeSelected(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  const handleSelectElement = useCallback((element: typeof editor.selectedElement) => {
    editor.setSelectedElement(element);
    setIsThemeSelected(false);
  }, [editor]);

  const handleSelectTheme = useCallback(() => {
    editor.setSelectedElement(null);
    setIsThemeSelected(true);
  }, [editor]);

  const handlePreview = useCallback(() => {
    // Save draft to localStorage before opening preview
    editor.saveDraft();
    window.open("/preview", "_blank");
  }, [editor]);

  const handlePublish = async () => {
    setIsPublishing(true);
    const payload = editor.getPublishPayload();
    const { error } = await updateMultiple(payload);
    if (error) {
      toast.error("Erro ao publicar alterações");
    } else {
      toast.success("🎉 Tema publicado!");
      editor.setIsDirty(false);
    }
    setIsPublishing(false);
  };

  if (settingsLoading) {
    return (
      <AdminLayout title="Editor de Tema">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Editor de Tema">
      <div className="h-[calc(100vh-160px)] flex flex-col gap-4">
        <EditorToolbar
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onUndo={editor.undo}
          onRedo={editor.redo}
          previewDevice={editor.previewDevice}
          onDeviceChange={editor.setPreviewDevice}
          isDarkMode={editor.isDarkMode}
          onDarkModeToggle={() => editor.setIsDarkMode(!editor.isDarkMode)}
          isDirty={editor.isDirty}
          isPublishing={isPublishing}
          onReset={editor.resetToDefault}
          onPublish={handlePublish}
          onPreview={handlePreview}
        />

        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-2 bg-card border border-border rounded-2xl p-4 overflow-y-auto"
          >
            <LayersPanel
              elements={editor.elements}
              selectedElement={editor.selectedElement}
              onSelectElement={handleSelectElement}
              onSelectTheme={handleSelectTheme}
              isThemeSelected={isThemeSelected}
              elementOrder={editor.elementOrder}
              onReorderElements={editor.reorderElements}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-7 bg-secondary/30 border border-border rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-background/50 rounded-lg px-3 py-1 text-xs text-muted-foreground text-center max-w-xs mx-auto">
                  preview.allura.com
                </div>
              </div>
            </div>
            <EditorCanvas
              state={editor.state}
              selectedElement={editor.selectedElement}
              onSelectElement={handleSelectElement}
              previewDevice={editor.previewDevice}
              isDarkMode={editor.isDarkMode}
              elementOrder={editor.elementOrder}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-3 bg-card border border-border rounded-2xl p-4 overflow-y-auto"
          >
            <PropertiesPanel
              selectedElement={editor.selectedElement}
              isThemeSelected={isThemeSelected}
              state={editor.state}
              onUpdateElement={editor.updateElement}
              onUpdateTheme={editor.updateTheme}
            />
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
