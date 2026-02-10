import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleDetailsFooterProps {
  isDirty: boolean;
  isSaving: boolean;
  formId: string;
  onCancel: () => void;
  disableSave?: boolean;
}

export function RoleDetailsFooter({
  isDirty,
  isSaving,
  formId,
  onCancel,
  disableSave = false,
}: RoleDetailsFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-line-struct px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-txt-muted">
        {isDirty ? "Cambios sin guardar" : "Sin cambios"}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form={formId}
          disabled={!isDirty || isSaving || disableSave}
        >
          <Save className="size-4" />
          Guardar
        </Button>
      </div>
    </div>
  );
}
