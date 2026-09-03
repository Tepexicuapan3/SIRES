import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { ReligionDetailsGeneralSection } from "@features/admin/modules/catalogos/religiones/components/ReligionDetailsGeneralSection";
import { ReligionDialogHeader } from "@features/admin/modules/catalogos/religiones/components/ReligionDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  religionDetailsSchema,
  type ReligionDetailsFormValues,
} from "@features/admin/modules/catalogos/religiones/domain/religiones.schemas";
import { useUpdateReligion } from "@features/admin/modules/catalogos/religiones/mutations/useUpdateReligion";
import { useReligionDetail } from "@features/admin/modules/catalogos/religiones/queries/useReligionDetail";
import { getReligionErrorMessage } from "@features/admin/modules/catalogos/religiones/utils/religiones.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/religiones/utils/religiones.format";
import {
  mapReligionDetailToFormValues,
  buildUpdateReligionPayload,
} from "@features/admin/modules/catalogos/religiones/utils/religiones.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { ReligionListItem } from "@api/types";

interface ReligionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  religionSummary: ReligionListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: ReligionDetailsFormValues = { name: "" };
const FORM_ID = "religion-details-form";

export function ReligionDetailsDialog({
  open, onOpenChange, onClose, religionSummary, canEdit,
}: ReligionDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } = useDetailsDialogCloseGuard(onOpenChange);
  const religionId = religionSummary?.id;
  const {
    data: religionDetailResponse, isLoading, isError, error: religionDetailError, refetch,
  } = useReligionDetail(religionId, open && Boolean(religionId));

  const religionDetail = religionDetailResponse?.religion;
  const updateReligion = useUpdateReligion();

  const form = useForm<ReligionDetailsFormValues>({
    resolver: zodResolver(religionDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!religionDetail || !open || isDirty) return;
    form.reset(mapReligionDetailToFormValues(religionDetail));
  }, [religionDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(religionDetail ? mapReligionDetailToFormValues(religionDetail) : DEFAULT_FORM_VALUES);
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError = open && !isClosing && (isError || (!isLoading && !religionDetail));
  const readOnlyMessage = "Solo lectura: no puedes actualizar esta religion porque no tienes permisos.";

  const handleSave = async (values: ReligionDetailsFormValues) => {
    if (!religionDetail || !canEdit) return;
    const payload = buildUpdateReligionPayload(values, form.formState.dirtyFields);
    if (Object.keys(payload).length === 0) return;

    try {
      await updateReligion.mutateAsync({ id: religionDetail.id, data: payload });
      toast.success("Religion actualizada", { description: "Los cambios se guardaron correctamente." });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", { description: getReligionErrorMessage(error, "Error al guardar cambios") });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!religionDetail || !canEdit) return;
    try {
      await updateReligion.mutateAsync({ id: religionDetail.id, data: { isActive: nextActive } });
      toast.success(nextActive ? "Religion activada" : "Religion desactivada");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", { description: getReligionErrorMessage(error, "Error al actualizar estado") });
    }
  };

  const title = religionDetail?.name || religionSummary?.name || "Religion";
  const isActive = religionDetail?.isActive ?? religionSummary?.isActive;
  const statusBadge = typeof isActive === "boolean" ? <CatalogStatusBadge isActive={isActive} /> : null;

  const createdMetaLabel = religionDetail
    ? `Creado ${formatDate(religionDetail.createdAt)} por ${religionDetail.createdBy?.name ?? "-"}`
    : null;
  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>{createdMetaLabel}</span>
    </span>
  ) : null;

  const updatedMetaLabel = religionDetail?.updatedAt
    ? `Actualizado ${formatDateTime(religionDetail.updatedAt)} por ${religionDetail.updatedBy?.name ?? "-"}`
    : null;
  const updatedMeta = updatedMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <Pencil className="size-4 shrink-0" />
      <span className="truncate" title={updatedMetaLabel}>{updatedMetaLabel}</span>
    </span>
  ) : null;

  const loadingContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={`field-skel-${index}`} className="h-12" />
        ))}
      </div>
    </div>
  );

  const errorContent = (
    <div className="rounded-2xl border border-line-struct bg-paper p-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-status-critical/10 text-status-critical">
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-txt-body">No se pudo cargar la religion</h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getReligionErrorMessage(religionDetailError, "Intenta nuevamente para ver el detalle completo.")}
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>Reintentar</Button>
    </div>
  );

  const sections: AdminDetailsDialogSection[] = religionDetail
    ? [{
        id: "general",
        label: "General",
        content: (
          <>
            <ReligionDetailsGeneralSection
              form={form}
              formId={FORM_ID}
              religionDetail={religionDetail}
              onSubmit={handleSave}
              onStatusChange={handleStatusChange}
              isStatusPending={updateReligion.isPending}
              isEditable={canEdit}
            />
            {!canEdit ? <AdminReadOnlyNotice message={readOnlyMessage} /> : null}
          </>
        ),
      }]
    : [];

  return (
    <AdminDetailsDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      onRequestClose={closeDialog}
      titleSrOnly="Detalle de religion"
      descriptionSrOnly="Gestiona la configuracion de esta religion."
      header={
        religionSummary || religionDetail ? (
          <ReligionDialogHeader
            title={title}
            status={statusBadge}
            meta={religionDetail ? <span className="flex min-w-0 flex-wrap gap-3">{createdMeta}{updatedMeta}</span> : null}
          />
        ) : null
      }
      topContent={<Separator />}
      isDirty={isDirty}
      isLoading={shouldShowLoading}
      isError={shouldShowError}
      loadingContent={loadingContent}
      errorContent={errorContent}
      sections={sections}
      defaultSectionId="general"
      dialogContentClassName="h-auto max-h-[90vh] w-[86vw] max-w-none rounded-3xl bg-paper p-0 sm:max-w-[880px]"
      footer={({ onCancel }) => (
        <CatalogDetailsFooter
          isDirty={isDirty}
          isSaving={updateReligion.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
