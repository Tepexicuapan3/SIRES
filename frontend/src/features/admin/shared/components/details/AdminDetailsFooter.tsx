import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminDetailsFooterProps {
  isDirty: boolean;
  isSaving: boolean;
  formId: string;
  onCancel: () => void;
  onSave?: () => void;
  disableSave?: boolean;
  dirtyLabel?: string;
  cleanLabel?: string;
  cancelLabel?: string;
  saveLabel?: string;
}

export function AdminDetailsFooter({
  isDirty,
  isSaving,
  formId,
  onCancel,
  onSave,
  disableSave = false,
  dirtyLabel = "Cambios sin guardar",
  cleanLabel = "Sin cambios",
  cancelLabel = "Cancelar",
  saveLabel = "Guardar",
}: AdminDetailsFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-line-struct px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        className={cn(
          "text-xs",
          isDirty ? "font-medium text-status-alert" : "text-txt-muted",
        )}
      >
        {isDirty ? dirtyLabel : cleanLabel}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          type={onSave ? "button" : "submit"}
          form={onSave ? undefined : formId}
          onClick={onSave}
          disabled={!isDirty || isSaving || disableSave}
        >
          <Save className="size-4" />
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
