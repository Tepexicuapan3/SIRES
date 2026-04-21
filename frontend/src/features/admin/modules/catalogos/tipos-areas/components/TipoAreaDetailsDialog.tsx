import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { TipoAreaDetailsGeneralSection } from "@features/admin/modules/catalogos/tipos-areas/components/TipoAreaDetailsGeneralSection";
import { TipoAreaDialogHeader } from "@features/admin/modules/catalogos/tipos-areas/components/TipoAreaDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  tipoAreaDetailsSchema,
  type TipoAreaDetailsFormValues,
} from "@features/admin/modules/catalogos/tipos-areas/domain/tipos-areas.schemas";
import { useUpdateTipoArea } from "@features/admin/modules/catalogos/tipos-areas/mutations/useUpdateTipoArea";
import { useTipoAreaDetail } from "@features/admin/modules/catalogos/tipos-areas/queries/useTipoAreaDetail";
import { getTipoAreaErrorMessage } from "@features/admin/modules/catalogos/tipos-areas/utils/tipos-areas.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/tipos-areas/utils/tipos-areas.format";
import {
  mapTipoAreaDetailToFormValues,
  buildUpdateTipoAreaPayload,
} from "@features/admin/modules/catalogos/tipos-areas/utils/tipos-areas.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { TipoAreaListItem } from "@api/types";

interface TipoAreaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  tipoAreaSummary: TipoAreaListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: TipoAreaDetailsFormValues = {
  name: "",
};

const FORM_ID = "tipo-area-details-form";

export function TipoAreaDetailsDialog({
  open,
  onOpenChange,
  onClose,
  tipoAreaSummary,
  canEdit,
}: TipoAreaDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const tipoAreaId = tipoAreaSummary?.id;
  const {
    data: tipoAreaDetailResponse,
    isLoading,
    isError,
    error: tipoAreaDetailError,
    refetch,
  } = useTipoAreaDetail(tipoAreaId, open && Boolean(tipoAreaId));

  const tipoAreaDetail = tipoAreaDetailResponse?.areaType;
  const updateTipoArea = useUpdateTipoArea();

  const form = useForm<TipoAreaDetailsFormValues>({
    resolver: zodResolver(tipoAreaDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!tipoAreaDetail || !open || isDirty) return;
    form.reset(mapTipoAreaDetailToFormValues(tipoAreaDetail));
  }, [tipoAreaDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      tipoAreaDetail
        ? mapTipoAreaDetailToFormValues(tipoAreaDetail)
        : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !tipoAreaDetail));
  const readOnlyMessage =
    "Solo lectura: no puedes actualizar este tipo de area porque no tienes permisos.";

  const handleSave = async (values: TipoAreaDetailsFormValues) => {
    if (!tipoAreaDetail || !canEdit) return;
    const payload = buildUpdateTipoAreaPayload(
      values,
      form.formState.dirtyFields,
    );

    if (Object.keys(payload).length === 0) return;

    try {
      await updateTipoArea.mutateAsync({ id: tipoAreaDetail.id, data: payload });
      toast.success("Tipo de area actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getTipoAreaErrorMessage(
          error,
          "Error al guardar cambios",
        ),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!tipoAreaDetail || !canEdit) return;

    try {
      await updateTipoArea.mutateAsync({
        id: tipoAreaDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(
        nextActive ? "Tipo de area activado" : "Tipo de area desactivado",
      );
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoAreaErrorMessage(
          error,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const title =
    tipoAreaDetail?.name || tipoAreaSummary?.name || "Tipo de area";
  const isActive = tipoAreaDetail?.isActive ?? tipoAreaSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = tipoAreaDetail
    ? `Creado ${formatDate(tipoAreaDetail.createdAt)} por ${tipoAreaDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = tipoAreaDetail?.updatedAt
    ? `Actualizado ${formatDateTime(tipoAreaDetail.updatedAt)} por ${tipoAreaDetail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar el tipo de area
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getTipoAreaErrorMessage(
          tipoAreaDetailError,
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

  const sections: AdminDetailsDialogSection[] = tipoAreaDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <TipoAreaDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                tipoAreaDetail={tipoAreaDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateTipoArea.isPending}
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
      titleSrOnly="Detalle de tipo de area"
      descriptionSrOnly="Gestiona la configuracion de este tipo de area."
      header={
        tipoAreaSummary || tipoAreaDetail ? (
          <TipoAreaDialogHeader
            title={title}
            status={statusBadge}
            meta={
              tipoAreaDetail ? (
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
          isSaving={updateTipoArea.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
