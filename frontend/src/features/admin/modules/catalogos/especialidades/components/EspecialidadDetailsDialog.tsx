import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { EspecialidadDetailsGeneralSection } from "@features/admin/modules/catalogos/especialidades/components/EspecialidadDetailsGeneralSection";
import { EspecialidadDialogHeader } from "@features/admin/modules/catalogos/especialidades/components/EspecialidadDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  especialidadDetailsSchema,
  type EspecialidadDetailsFormValues,
} from "@features/admin/modules/catalogos/especialidades/domain/especialidades.schemas";
import { useUpdateEspecialidad } from "@features/admin/modules/catalogos/especialidades/mutations/useUpdateEspecialidad";
import { useEspecialidadDetail } from "@features/admin/modules/catalogos/especialidades/queries/useEspecialidadDetail";
import { getEspecialidadErrorMessage } from "@features/admin/modules/catalogos/especialidades/utils/especialidades.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/especialidades/utils/especialidades.format";
import {
  mapEspecialidadDetailToFormValues,
  buildUpdateEspecialidadPayload,
} from "@features/admin/modules/catalogos/especialidades/utils/especialidades.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { EspecialidadListItem } from "@api/types";

interface EspecialidadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  especialidadSummary: EspecialidadListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: EspecialidadDetailsFormValues = {
  name: "",
};

const FORM_ID = "especialidad-details-form";

export function EspecialidadDetailsDialog({
  open,
  onOpenChange,
  onClose,
  especialidadSummary,
  canEdit,
}: EspecialidadDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const especialidadId = especialidadSummary?.id;
  const {
    data: especialidadDetailResponse,
    isLoading,
    isError,
    error: especialidadDetailError,
    refetch,
  } = useEspecialidadDetail(
    especialidadId,
    open && Boolean(especialidadId),
  );

  const especialidadDetail = especialidadDetailResponse?.specialty;
  const updateEspecialidad = useUpdateEspecialidad();

  const form = useForm<EspecialidadDetailsFormValues>({
    resolver: zodResolver(especialidadDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!especialidadDetail || !open || isDirty) return;
    form.reset(mapEspecialidadDetailToFormValues(especialidadDetail));
  }, [especialidadDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      especialidadDetail
        ? mapEspecialidadDetailToFormValues(especialidadDetail)
        : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open &&
    !isClosing &&
    (isError || (!isLoading && !especialidadDetail));

  const handleSave = async (values: EspecialidadDetailsFormValues) => {
    if (!especialidadDetail || !canEdit) return;
    const payload = buildUpdateEspecialidadPayload(
      values,
      form.formState.dirtyFields,
    );

    if (Object.keys(payload).length === 0) return;

    try {
      await updateEspecialidad.mutateAsync({
        id: especialidadDetail.id,
        data: payload,
      });
      toast.success("Especialidad actualizada", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getEspecialidadErrorMessage(
          error,
          "Error al guardar cambios",
        ),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!especialidadDetail || !canEdit) return;

    try {
      await updateEspecialidad.mutateAsync({
        id: especialidadDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(
        nextActive ? "Especialidad activada" : "Especialidad desactivada",
      );
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getEspecialidadErrorMessage(
          error,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const title =
    especialidadDetail?.name ||
    especialidadSummary?.name ||
    "Especialidad";
  const isActive =
    especialidadDetail?.isActive ?? especialidadSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = especialidadDetail
    ? `Creado ${formatDate(especialidadDetail.createdAt)} por ${especialidadDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = especialidadDetail?.updatedAt
    ? `Actualizado ${formatDateTime(especialidadDetail.updatedAt)} por ${especialidadDetail.updatedBy?.name ?? "-"}`
    : null;

  const updatedMeta = updatedMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <Pencil className="size-4 shrink-0" />
      <span className="truncate" title={updatedMetaLabel}>
        {updatedMetaLabel}
      </span>
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
        {Array.from({ length: 4 }).map((_, index) => (
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
      <h3 className="mt-4 text-base font-semibold text-txt-body">
        No se pudo cargar la especialidad
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getEspecialidadErrorMessage(
          especialidadDetailError,
          "Intenta nuevamente para ver el detalle completo.",
        )}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => void refetch()}
      >
        Reintentar
      </Button>
    </div>
  );

  const sections: AdminDetailsDialogSection[] = especialidadDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <EspecialidadDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                especialidadDetail={especialidadDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateEspecialidad.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar esta especialidad porque no tienes permisos." />
              ) : null}
            </>
          ),
        },
      ]
    : [];

  return (
    <AdminDetailsDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      onRequestClose={closeDialog}
      titleSrOnly="Detalle de especialidad"
      descriptionSrOnly="Gestiona la configuración de esta especialidad."
      header={
        especialidadSummary || especialidadDetail ? (
          <EspecialidadDialogHeader
            title={title}
            status={statusBadge}
            meta={
              especialidadDetail ? (
                <span className="flex min-w-0 flex-wrap gap-3">
                  {createdMeta}
                  {updatedMeta}
                </span>
              ) : null
            }
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
          isSaving={updateEspecialidad.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
