import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { TipoCitaDetailsGeneralSection } from "@features/admin/modules/catalogos/tipos-citas/components/TipoCitaDetailsGeneralSection";
import { TipoCitaDialogHeader } from "@features/admin/modules/catalogos/tipos-citas/components/TipoCitaDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  tipoCitaDetailsSchema,
  type TipoCitaDetailsFormValues,
} from "@features/admin/modules/catalogos/tipos-citas/domain/tipos-citas.schemas";
import { useUpdateTipoCita } from "@features/admin/modules/catalogos/tipos-citas/mutations/useUpdateTipoCita";
import { useTipoCitaDetail } from "@features/admin/modules/catalogos/tipos-citas/queries/useTipoCitaDetail";
import { getTipoCitaErrorMessage } from "@features/admin/modules/catalogos/tipos-citas/utils/tipos-citas.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/tipos-citas/utils/tipos-citas.format";
import {
  mapTipoCitaDetailToFormValues,
  buildUpdateTipoCitaPayload,
} from "@features/admin/modules/catalogos/tipos-citas/utils/tipos-citas.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { TipoCitaListItem } from "@api/types";

interface TipoCitaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  tipoCitaSummary: TipoCitaListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: TipoCitaDetailsFormValues = {
  name: "",
};

const FORM_ID = "tipo-cita-details-form";

export function TipoCitaDetailsDialog({
  open,
  onOpenChange,
  onClose,
  tipoCitaSummary,
  canEdit,
}: TipoCitaDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const tipoCitaId = tipoCitaSummary?.id;
  const {
    data: tipoCitaDetailResponse,
    isLoading,
    isError,
    error: tipoCitaDetailError,
    refetch,
  } = useTipoCitaDetail(tipoCitaId, open && Boolean(tipoCitaId));

  const tipoCitaDetail = tipoCitaDetailResponse?.appointmentType;
  const updateTipoCita = useUpdateTipoCita();

  const form = useForm<TipoCitaDetailsFormValues>({
    resolver: zodResolver(tipoCitaDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!tipoCitaDetail || !open || isDirty) return;
    form.reset(mapTipoCitaDetailToFormValues(tipoCitaDetail));
  }, [tipoCitaDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      tipoCitaDetail
        ? mapTipoCitaDetailToFormValues(tipoCitaDetail)
        : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !tipoCitaDetail));
  const readOnlyMessage =
    "Solo lectura: no puedes actualizar este tipo de cita porque no tienes permisos.";

  const handleSave = async (values: TipoCitaDetailsFormValues) => {
    if (!tipoCitaDetail || !canEdit) return;
    const payload = buildUpdateTipoCitaPayload(
      values,
      form.formState.dirtyFields,
    );

    if (Object.keys(payload).length === 0) return;

    try {
      await updateTipoCita.mutateAsync({ id: tipoCitaDetail.id, data: payload });
      toast.success("Tipo de cita actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getTipoCitaErrorMessage(
          error,
          "Error al guardar cambios",
        ),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!tipoCitaDetail || !canEdit) return;

    try {
      await updateTipoCita.mutateAsync({
        id: tipoCitaDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(
        nextActive ? "Tipo de cita activado" : "Tipo de cita desactivado",
      );
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoCitaErrorMessage(
          error,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const title =
    tipoCitaDetail?.name || tipoCitaSummary?.name || "Tipo de cita";
  const isActive = tipoCitaDetail?.isActive ?? tipoCitaSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = tipoCitaDetail
    ? `Creado ${formatDate(tipoCitaDetail.createdAt)} por ${tipoCitaDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = tipoCitaDetail?.updatedAt
    ? `Actualizado ${formatDateTime(tipoCitaDetail.updatedAt)} por ${tipoCitaDetail.updatedBy?.name ?? "-"}`
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
      <h3 className="mt-4 text-base font-semibold text-txt-body">
        No se pudo cargar el tipo de cita
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getTipoCitaErrorMessage(
          tipoCitaDetailError,
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

  const sections: AdminDetailsDialogSection[] = tipoCitaDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <TipoCitaDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                tipoCitaDetail={tipoCitaDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateTipoCita.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message={readOnlyMessage} />
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
      titleSrOnly="Detalle de tipo de cita"
      descriptionSrOnly="Gestiona la configuracion de este tipo de cita."
      header={
        tipoCitaSummary || tipoCitaDetail ? (
          <TipoCitaDialogHeader
            title={title}
            status={statusBadge}
            meta={
              tipoCitaDetail ? (
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
          isSaving={updateTipoCita.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
