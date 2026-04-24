import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { VacunaDetailsGeneralSection } from "@features/admin/modules/catalogos/vacunas/components/VacunaDetailsGeneralSection";
import { VacunaDialogHeader } from "@features/admin/modules/catalogos/vacunas/components/VacunaDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  vacunaDetailsSchema,
  type VacunaDetailsFormValues,
} from "@features/admin/modules/catalogos/vacunas/domain/vacunas.schemas";
import { useUpdateVacuna } from "@features/admin/modules/catalogos/vacunas/mutations/useUpdateVacuna";
import { useVacunaDetail } from "@features/admin/modules/catalogos/vacunas/queries/useVacunaDetail";
import { getVacunaErrorMessage } from "@features/admin/modules/catalogos/vacunas/utils/vacunas.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/vacunas/utils/vacunas.format";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { VacunaListItem, UpdateVacunaRequest } from "@api/types";

interface VacunaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  vacunaSummary: VacunaListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: VacunaDetailsFormValues = {
  name: "",
};

const FORM_ID = "vacuna-details-form";

export function VacunaDetailsDialog({
  open,
  onOpenChange,
  onClose,
  vacunaSummary,
  canEdit,
}: VacunaDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);

  const vacunaId = vacunaSummary?.id;

  const {
    data: vacunaDetailResponse,
    isLoading,
    isError,
    error: vacunaDetailError,
    refetch,
  } = useVacunaDetail(vacunaId, open && Boolean(vacunaId));

  const vacunaDetail = vacunaDetailResponse?.vaccine;
  const updateVacuna = useUpdateVacuna();

  const form = useForm<VacunaDetailsFormValues>({
    resolver: zodResolver(vacunaDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!vacunaDetail || !open || isDirty) return;
    form.reset({ name: vacunaDetail.name ?? "" });
  }, [vacunaDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    if (vacunaDetail) {
      form.reset({ name: vacunaDetail.name ?? "" });
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !vacunaDetail));

  const handleSave = async (values: VacunaDetailsFormValues) => {
    if (!vacunaDetail || !canEdit) return;

    const payload: UpdateVacunaRequest = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.name) payload.name = values.name;

    if (Object.keys(payload).length === 0) return;

    try {
      await updateVacuna.mutateAsync({ vacunaId: vacunaDetail.id, data: payload });
      toast.success("Vacuna actualizada", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getVacunaErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!vacunaDetail || !canEdit) return;

    try {
      await updateVacuna.mutateAsync({
        vacunaId: vacunaDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Vacuna activada" : "Vacuna desactivada");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getVacunaErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = vacunaDetail?.name || vacunaSummary?.name || "Vacuna";
  const isActive = vacunaDetail?.isActive ?? vacunaSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = vacunaDetail
    ? `Creado ${formatDate(vacunaDetail.createdAt)} por ${vacunaDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = vacunaDetail?.updatedAt
    ? `Actualizado ${formatDateTime(vacunaDetail.updatedAt)} por ${vacunaDetail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar la vacuna
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getVacunaErrorMessage(
          vacunaDetailError,
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

  const sections: AdminDetailsDialogSection[] = vacunaDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <VacunaDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                vacunaDetail={vacunaDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateVacuna.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar esta vacuna porque no tienes permisos." />
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
      titleSrOnly="Detalle de vacuna"
      descriptionSrOnly="Gestiona la configuracion de esta vacuna."
      header={
        vacunaSummary || vacunaDetail ? (
          <VacunaDialogHeader
            title={title}
            status={statusBadge}
            meta={
              vacunaDetail ? (
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
          isSaving={updateVacuna.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
