import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { DiscapacidadDetailsGeneralSection } from "@features/admin/modules/catalogos/discapacidades/components/DiscapacidadDetailsGeneralSection";
import { DiscapacidadDialogHeader } from "@features/admin/modules/catalogos/discapacidades/components/DiscapacidadDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  discapacidadDetailsSchema,
  type DiscapacidadDetailsFormValues,
} from "@features/admin/modules/catalogos/discapacidades/domain/discapacidades.schemas";
import { useUpdateDiscapacidad } from "@features/admin/modules/catalogos/discapacidades/mutations/useUpdateDiscapacidad";
import { useDiscapacidadDetail } from "@features/admin/modules/catalogos/discapacidades/queries/useDiscapacidadDetail";
import { getDiscapacidadErrorMessage } from "@features/admin/modules/catalogos/discapacidades/utils/discapacidades.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/discapacidades/utils/discapacidades.format";
import {
  mapDiscapacidadDetailToFormValues,
  buildUpdateDiscapacidadPayload,
} from "@features/admin/modules/catalogos/discapacidades/utils/discapacidades.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { DiscapacidadListItem } from "@api/types";

interface DiscapacidadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  discapacidadSummary: DiscapacidadListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: DiscapacidadDetailsFormValues = {
  name: "",
  code: "",
};

const FORM_ID = "discapacidad-details-form";

export function DiscapacidadDetailsDialog({
  open,
  onOpenChange,
  onClose,
  discapacidadSummary,
  canEdit,
}: DiscapacidadDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const discapacidadId = discapacidadSummary?.id;
  const {
    data: discapacidadDetailResponse,
    isLoading,
    isError,
    error: discapacidadDetailError,
    refetch,
  } = useDiscapacidadDetail(discapacidadId, open && Boolean(discapacidadId));

  const discapacidadDetail = discapacidadDetailResponse?.disability;
  const updateDiscapacidad = useUpdateDiscapacidad();

  const form = useForm<DiscapacidadDetailsFormValues>({
    resolver: zodResolver(discapacidadDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!discapacidadDetail || !open || isDirty) return;
    form.reset(mapDiscapacidadDetailToFormValues(discapacidadDetail));
  }, [discapacidadDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      discapacidadDetail
        ? mapDiscapacidadDetailToFormValues(discapacidadDetail)
        : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !discapacidadDetail));
  const readOnlyMessage =
    "Solo lectura: no puedes actualizar esta discapacidad porque no tienes permisos.";

  const handleSave = async (values: DiscapacidadDetailsFormValues) => {
    if (!discapacidadDetail || !canEdit) return;
    const payload = buildUpdateDiscapacidadPayload(values, form.formState.dirtyFields);

    if (Object.keys(payload).length === 0) return;

    try {
      await updateDiscapacidad.mutateAsync({ id: discapacidadDetail.id, data: payload });
      toast.success("Discapacidad actualizada", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getDiscapacidadErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!discapacidadDetail || !canEdit) return;

    try {
      await updateDiscapacidad.mutateAsync({
        id: discapacidadDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Discapacidad activada" : "Discapacidad desactivada");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getDiscapacidadErrorMessage(
          error,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const title = discapacidadDetail?.name || discapacidadSummary?.name || "Discapacidad";
  const subtitle = discapacidadDetail?.code || discapacidadSummary?.code || null;
  const isActive = discapacidadDetail?.isActive ?? discapacidadSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = discapacidadDetail
    ? `Creado ${formatDate(discapacidadDetail.createdAt)} por ${discapacidadDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = discapacidadDetail?.updatedAt
    ? `Actualizado ${formatDateTime(discapacidadDetail.updatedAt)} por ${discapacidadDetail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar la discapacidad
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getDiscapacidadErrorMessage(
          discapacidadDetailError,
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

  const sections: AdminDetailsDialogSection[] = discapacidadDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <DiscapacidadDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                discapacidadDetail={discapacidadDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateDiscapacidad.isPending}
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
      titleSrOnly="Detalle de discapacidad"
      descriptionSrOnly="Gestiona la configuracion de esta discapacidad."
      header={
        discapacidadSummary || discapacidadDetail ? (
          <DiscapacidadDialogHeader
            title={title}
            subtitle={subtitle}
            status={statusBadge}
            meta={
              discapacidadDetail ? (
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
          isSaving={updateDiscapacidad.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
