import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface InlineEditableProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  style?: React.CSSProperties;
  placeholder?: string;
}

export default function InlineEditable({
  value,
  onChange,
  className,
  as: Tag = "span",
  style,
  placeholder = "Clique para editar...",
}: InlineEditableProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  if (isEditing) {
    const isMultiline = Tag === "p" || value.length > 50;

    if (isMultiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full bg-transparent border-2 border-primary rounded-lg p-2 outline-none resize-none",
            className
          )}
          style={style}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full bg-transparent border-2 border-primary rounded-lg p-1 outline-none",
          className
        )}
        style={style}
      />
    );
  }

  return (
    <Tag
      onDoubleClick={handleDoubleClick}
      className={cn(
        "cursor-text transition-all hover:bg-primary/5 rounded-lg",
        !value && "text-muted-foreground/50 italic",
        className
      )}
      style={style}
      title="Clique duas vezes para editar"
    >
      {value || placeholder}
    </Tag>
  );
}
