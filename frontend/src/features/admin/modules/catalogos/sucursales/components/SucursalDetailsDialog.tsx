import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { SucursalDetailsGeneralSection } from "@features/admin/modules/catalogos/sucursales/components/SucursalDetailsGeneralSection";
import { SucursalDialogHeader } from "@features/admin/modules/catalogos/sucursales/components/SucursalDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  sucursalDetailsSchema,
  type SucursalDetailsFormValues,
} from "@features/admin/modules/catalogos/sucursales/domain/sucursales.schemas";
import { useUpdateSucursal } from "@features/admin/modules/catalogos/sucursales/mutations/useUpdateSucursal";
import { useSucursalDetail } from "@features/admin/modules/catalogos/sucursales/queries/useSucursalDetail";
import { getSucursalErrorMessage } from "@features/admin/modules/catalogos/sucursales/utils/sucursales.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/sucursales/utils/sucursales.format";
import {
  mapSucursalDetailToFormValues,
  buildUpdateSucursalPayload,
} from "@features/admin/modules/catalogos/sucursales/utils/sucursales.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { SucursalListItem } from "@api/types";

interface SucursalDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  sucursalSummary: SucursalListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: SucursalDetailsFormValues = {
  name: "",
};

const FORM_ID = "sucursal-details-form";

export function SucursalDetailsDialog({
  open,
  onOpenChange,
  onClose,
  sucursalSummary,
  canEdit,
}: SucursalDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);

  const itemId = sucursalSummary?.id;

  const {
    data: detailResponse,
    isLoading,
    isError,
    error: detailError,
    refetch,
  } = useSucursalDetail(itemId, open && Boolean(itemId));

  const detail = detailResponse?.branch;
  const updateSucursal = useUpdateSucursal();

  const form = useForm<SucursalDetailsFormValues>({
    resolver: zodResolver(sucursalDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!detail || !open || isDirty) return;
    form.reset(mapSucursalDetailToFormValues(detail));
  }, [detail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      detail ? mapSucursalDetailToFormValues(detail) : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !detail));

  const handleSave = async (values: SucursalDetailsFormValues) => {
    if (!detail || !canEdit) return;

    const payload = buildUpdateSucursalPayload(values, form.formState.dirtyFields);

    if (Object.keys(payload).length === 0) return;

    try {
      await updateSucursal.mutateAsync({ id: detail.id, data: payload });
      toast.success("Sucursal actualizada", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getSucursalErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!detail || !canEdit) return;

    try {
      await updateSucursal.mutateAsync({
        id: detail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Sucursal activada" : "Sucursal desactivada");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getSucursalErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = detail?.name || sucursalSummary?.name || "Sucursal";
  const isActive = detail?.isActive ?? sucursalSummary?.isActive;

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
        No se pudo cargar la sucursal
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getSucursalErrorMessage(
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
              <SucursalDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                sucursalDetail={detail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateSucursal.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar esta sucursal porque no tienes permisos." />
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
      titleSrOnly="Detalle de sucursal"
      descriptionSrOnly="Gestiona la configuracion de esta sucursal."
      header={
        sucursalSummary || detail ? (
          <SucursalDialogHeader
            title={title}
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
          isSaving={updateSucursal.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
