import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { TipoResidenciaDetailsGeneralSection } from "@features/admin/modules/catalogos/tipos-residencia/components/TipoResidenciaDetailsGeneralSection";
import { TipoResidenciaDialogHeader } from "@features/admin/modules/catalogos/tipos-residencia/components/TipoResidenciaDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  tipoResidenciaDetailsSchema,
  type TipoResidenciaDetailsFormValues,
} from "@features/admin/modules/catalogos/tipos-residencia/domain/tipos-residencia.schemas";
import { useUpdateTipoResidencia } from "@features/admin/modules/catalogos/tipos-residencia/mutations/useUpdateTipoResidencia";
import { useTipoResidenciaDetail } from "@features/admin/modules/catalogos/tipos-residencia/queries/useTipoResidenciaDetail";
import { getTipoResidenciaErrorMessage } from "@features/admin/modules/catalogos/tipos-residencia/utils/tipos-residencia.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/tipos-residencia/utils/tipos-residencia.format";
import {
  mapTipoResidenciaDetailToFormValues,
  buildUpdateTipoResidenciaPayload,
} from "@features/admin/modules/catalogos/tipos-residencia/utils/tipos-residencia.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { TipoResidenciaListItem } from "@api/types";

interface TipoResidenciaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  tipoResidenciaSummary: TipoResidenciaListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: TipoResidenciaDetailsFormValues = { name: "" };
const FORM_ID = "tipo-residencia-details-form";

export function TipoResidenciaDetailsDialog({
  open, onOpenChange, onClose, tipoResidenciaSummary, canEdit,
}: TipoResidenciaDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } = useDetailsDialogCloseGuard(onOpenChange);
  const tipoResidenciaId = tipoResidenciaSummary?.id;
  const {
    data: tipoResidenciaDetailResponse, isLoading, isError, error: tipoResidenciaDetailError, refetch,
  } = useTipoResidenciaDetail(tipoResidenciaId, open && Boolean(tipoResidenciaId));

  const tipoResidenciaDetail = tipoResidenciaDetailResponse?.residenceType;
  const updateTipoResidencia = useUpdateTipoResidencia();

  const form = useForm<TipoResidenciaDetailsFormValues>({
    resolver: zodResolver(tipoResidenciaDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!tipoResidenciaDetail || !open || isDirty) return;
    form.reset(mapTipoResidenciaDetailToFormValues(tipoResidenciaDetail));
  }, [tipoResidenciaDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(tipoResidenciaDetail ? mapTipoResidenciaDetailToFormValues(tipoResidenciaDetail) : DEFAULT_FORM_VALUES);
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError = open && !isClosing && (isError || (!isLoading && !tipoResidenciaDetail));
  const readOnlyMessage = "Solo lectura: no puedes actualizar este tipo de residencia porque no tienes permisos.";

  const handleSave = async (values: TipoResidenciaDetailsFormValues) => {
    if (!tipoResidenciaDetail || !canEdit) return;
    const payload = buildUpdateTipoResidenciaPayload(values, form.formState.dirtyFields);
    if (Object.keys(payload).length === 0) return;

    try {
      await updateTipoResidencia.mutateAsync({ id: tipoResidenciaDetail.id, data: payload });
      toast.success("Tipo de residencia actualizado", { description: "Los cambios se guardaron correctamente." });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", { description: getTipoResidenciaErrorMessage(error, "Error al guardar cambios") });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!tipoResidenciaDetail || !canEdit) return;
    try {
      await updateTipoResidencia.mutateAsync({ id: tipoResidenciaDetail.id, data: { isActive: nextActive } });
      toast.success(nextActive ? "Tipo de residencia activado" : "Tipo de residencia desactivado");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", { description: getTipoResidenciaErrorMessage(error, "Error al actualizar estado") });
    }
  };

  const title = tipoResidenciaDetail?.name || tipoResidenciaSummary?.name || "Tipo de residencia";
  const isActive = tipoResidenciaDetail?.isActive ?? tipoResidenciaSummary?.isActive;
  const statusBadge = typeof isActive === "boolean" ? <CatalogStatusBadge isActive={isActive} /> : null;

  const createdMetaLabel = tipoResidenciaDetail
    ? `Creado ${formatDate(tipoResidenciaDetail.createdAt)} por ${tipoResidenciaDetail.createdBy?.name ?? "-"}`
    : null;
  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>{createdMetaLabel}</span>
    </span>
  ) : null;

  const updatedMetaLabel = tipoResidenciaDetail?.updatedAt
    ? `Actualizado ${formatDateTime(tipoResidenciaDetail.updatedAt)} por ${tipoResidenciaDetail.updatedBy?.name ?? "-"}`
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
      <h3 className="mt-4 text-base font-semibold text-txt-body">No se pudo cargar el tipo de residencia</h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getTipoResidenciaErrorMessage(tipoResidenciaDetailError, "Intenta nuevamente para ver el detalle completo.")}
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>Reintentar</Button>
    </div>
  );

  const sections: AdminDetailsDialogSection[] = tipoResidenciaDetail
    ? [{
        id: "general",
        label: "General",
        content: (
          <>
            <TipoResidenciaDetailsGeneralSection
              form={form}
              formId={FORM_ID}
              tipoResidenciaDetail={tipoResidenciaDetail}
              onSubmit={handleSave}
              onStatusChange={handleStatusChange}
              isStatusPending={updateTipoResidencia.isPending}
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
      titleSrOnly="Detalle de tipo de residencia"
      descriptionSrOnly="Gestiona la configuracion de este tipo de residencia."
      header={
        tipoResidenciaSummary || tipoResidenciaDetail ? (
          <TipoResidenciaDialogHeader
            title={title}
            status={statusBadge}
            meta={tipoResidenciaDetail ? <span className="flex min-w-0 flex-wrap gap-3">{createdMeta}{updatedMeta}</span> : null}
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
          isSaving={updateTipoResidencia.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
