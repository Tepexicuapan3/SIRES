import { AdminDetailsFooter } from "@features/admin/shared/components/details/AdminDetailsFooter";

interface CatalogDetailsFooterProps {
  isDirty: boolean;
  isSaving: boolean;
  formId: string;
  onCancel: () => void;
  disableSave?: boolean;
}

export function CatalogDetailsFooter({
  isDirty,
  isSaving,
  formId,
  onCancel,
  disableSave = false,
}: CatalogDetailsFooterProps) {
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
