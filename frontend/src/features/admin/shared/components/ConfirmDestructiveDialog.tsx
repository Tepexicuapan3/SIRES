import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";

interface ConfirmDestructiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  warning?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  textAlign?: "center" | "right" | "left";
  onConfirm: () => void;
  confirmDisabled?: boolean;
}

export function ConfirmDestructiveDialog({
  open,
  onOpenChange,
  title,
  description,
  warning,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  textAlign = "center",
  onConfirm,
  confirmDisabled = false,
}: ConfirmDestructiveDialogProps) {
  const headerAlignClass =
    textAlign === "right"
      ? "sm:!place-items-end sm:!text-right"
      : textAlign === "left"
        ? "sm:!place-items-start sm:!text-left"
        : "sm:!place-items-center sm:!text-center";

  const textAlignClass =
    textAlign === "right"
      ? "text-right"
      : textAlign === "left"
        ? "text-left"
        : "text-center";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        className="overflow-hidden rounded-2xl border-line-struct/60 bg-paper p-0 shadow-modal data-[size=sm]:max-w-sm"
      >
        <AlertDialogHeader className={`px-6 pt-6 pb-5 ${headerAlignClass}`}>
          <span className="inline-flex size-10 self-center items-center justify-center rounded-full bg-status-critical/10 text-status-critical">
            <TriangleAlert className="size-5" />
          </span>
          <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
          <AlertDialogDescription
            className={`max-w-sm text-txt-muted ${textAlignClass}`}
          >
            {description}
          </AlertDialogDescription>
          {warning ? (
            <div
              className={`w-full rounded-xl border border-status-alert/40 bg-status-alert/10 px-3 py-2 text-xs font-medium text-status-alert sm:max-w-sm ${textAlignClass}`}
            >
              {warning}
            </div>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter className="!grid !grid-cols-2 gap-3 border-t border-line-struct/60 bg-subtle/30 px-4 py-4 sm:!grid sm:!grid-cols-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 w-full rounded-xl border-line-struct/70 bg-subtle/60 hover:bg-subtle">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="w-full rounded-xl"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
