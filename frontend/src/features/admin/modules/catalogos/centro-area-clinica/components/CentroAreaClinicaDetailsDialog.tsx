import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { CentroAreaClinicaDetailsGeneralSection } from "@features/admin/modules/catalogos/centro-area-clinica/components/CentroAreaClinicaDetailsGeneralSection";
import { CentroAreaClinicaDialogHeader } from "@features/admin/modules/catalogos/centro-area-clinica/components/CentroAreaClinicaDialogHeader";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { useUpdateCentroAreaClinica } from "@features/admin/modules/catalogos/centro-area-clinica/mutations/useUpdateCentroAreaClinica";
import { useCentroAreaClinicaDetail } from "@features/admin/modules/catalogos/centro-area-clinica/queries/useCentroAreaClinicaDetail";
import { getCentroAreaClinicaErrorMessage } from "@features/admin/modules/catalogos/centro-area-clinica/utils/centro-area-clinica.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/centro-area-clinica/utils/centro-area-clinica.format";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { CentroAreaClinicaListItem } from "@api/types";

interface CentroAreaClinicaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  selectedItem: CentroAreaClinicaListItem | null;
  canEdit: boolean;
}

export function CentroAreaClinicaDetailsDialog({
  open,
  onOpenChange,
  onClose,
  selectedItem,
  canEdit,
}: CentroAreaClinicaDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);

  const centerId = selectedItem?.center.id;
  const areaId = selectedItem?.areaClinica.id;

  const {
    data: detailResponse,
    isLoading,
    isError,
    error: detailError,
    refetch,
  } = useCentroAreaClinicaDetail(centerId, areaId, open && Boolean(centerId) && Boolean(areaId));

  const detail = detailResponse?.careCenterClinicalArea;
  const updateItem = useUpdateCentroAreaClinica();

  const closeDialog = () => {
    markClosing();
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !detail));

  const handleStatusChange = async (nextActive: boolean) => {
    if (!detail || !centerId || !areaId || !canEdit) return;

    try {
      await updateItem.mutateAsync({
        centerId,
        areaId,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Asignación activada" : "Asignación desactivada");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getCentroAreaClinicaErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = detail?.areaClinica.name || selectedItem?.areaClinica.name || "Área clínica";
  const subtitle = detail?.center.name || selectedItem?.center.name || null;
  const isActive = detail?.isActive ?? selectedItem?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = detail
    ? `Creado ${formatDate(detail.createdAt)} por ${detail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = detail?.updatedAt
    ? `Actualizado ${formatDateTime(detail.updatedAt)} por ${detail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar la asignación
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getCentroAreaClinicaErrorMessage(
          detailError,
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

  const sections: AdminDetailsDialogSection[] = detail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <CentroAreaClinicaDetailsGeneralSection
                detail={detail}
                onStatusChange={handleStatusChange}
                isStatusPending={updateItem.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar esta asignación porque no tienes permisos." />
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
      titleSrOnly="Detalle de área clínica por centro"
      descriptionSrOnly="Gestiona la asignación de área clínica a centro de atención."
      header={
        selectedItem || detail ? (
          <CentroAreaClinicaDialogHeader
            title={title}
            subtitle={subtitle}
            status={statusBadge}
            meta={
              detail ? (
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
      isDirty={false}
      isLoading={shouldShowLoading}
      isError={shouldShowError}
      loadingContent={loadingContent}
      errorContent={errorContent}
      sections={sections}
      defaultSectionId="general"
      dialogContentClassName="h-auto max-h-[90vh] w-[86vw] max-w-none rounded-3xl bg-paper p-0 sm:max-w-[880px]"
      footer={({ onCancel }) => (
        <div className="flex items-center justify-end border-t border-line-struct px-6 py-4">
          <Button variant="outline" onClick={onCancel}>
            Cerrar
          </Button>
        </div>
      )}
    />
  );
}
