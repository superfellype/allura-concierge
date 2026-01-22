import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Type, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Digite a descrição do produto...",
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Only allow paragraph, hard break, and bold
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        italic: false,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none",
          "prose-p:my-2 prose-p:leading-relaxed"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-xl overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
          title="Negrito (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className="h-8 px-2 gap-1"
          title="Quebra de linha (Shift+Enter)"
        >
          <CornerDownLeft className="w-3 h-3" />
          <span className="text-xs">Quebra</span>
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {editor.storage.characterCount?.characters?.() ?? 0} caracteres
        </span>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="min-h-[200px]"
      />

      {/* Placeholder when empty */}
      {editor.isEmpty && (
        <div className="absolute top-[52px] left-4 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
}
