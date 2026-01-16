import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="liquid-card-strong">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="font-body text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="glass-button rounded-xl font-body">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`rounded-xl font-body ${
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "liquid-button text-primary-foreground"
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { ConfirmDialog };
export default ConfirmDialog;
