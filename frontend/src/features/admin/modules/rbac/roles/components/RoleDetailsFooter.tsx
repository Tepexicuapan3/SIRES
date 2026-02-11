import { AdminDetailsFooter } from "@features/admin/shared/components/details/AdminDetailsFooter";

interface RoleDetailsFooterProps {
  isDirty: boolean;
  isSaving: boolean;
  formId: string;
  onCancel: () => void;
  onSave?: () => void;
  disableSave?: boolean;
}

export function RoleDetailsFooter({
  isDirty,
  isSaving,
  formId,
  onCancel,
  onSave,
  disableSave = false,
}: RoleDetailsFooterProps) {
  return (
    <AdminDetailsFooter
      isDirty={isDirty}
      isSaving={isSaving}
      formId={formId}
      onCancel={onCancel}
      onSave={onSave}
      disableSave={disableSave}
    />
  );
}
