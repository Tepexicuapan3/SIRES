import { AdminDetailsFooter } from "@features/admin/shared/components/details/AdminDetailsFooter";

interface AreaDetailsFooterProps {
  isDirty: boolean;
  isSaving: boolean;
  formId: string;
  onCancel: () => void;
  disableSave?: boolean;
}

export function AreaDetailsFooter({
  isDirty,
  isSaving,
  formId,
  onCancel,
  disableSave = false,
}: AreaDetailsFooterProps) {
  return (
    <AdminDetailsFooter
      isDirty={isDirty}
      isSaving={isSaving}
      formId={formId}
      onCancel={onCancel}
      disableSave={disableSave}
    />
  );
}
