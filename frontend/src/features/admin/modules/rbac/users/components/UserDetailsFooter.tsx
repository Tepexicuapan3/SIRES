import { AdminDetailsFooter } from "@features/admin/shared/components/details/AdminDetailsFooter";

interface UserDetailsFooterProps {
  isDirty: boolean;
  isSaving: boolean;
  formId: string;
  onCancel: () => void;
  onSave?: () => void;
  disableSave?: boolean;
}

export function UserDetailsFooter({
  isDirty,
  isSaving,
  formId,
  onCancel,
  onSave,
  disableSave = false,
}: UserDetailsFooterProps) {
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
