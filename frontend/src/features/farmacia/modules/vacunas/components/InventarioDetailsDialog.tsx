import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { InventarioVacunaListItem, UpdateInventarioVacunaRequest } from "@api/types";
import { InventarioDialogHeader } from "./InventarioDialogHeader";
import { InventarioDetailsGeneralSection } from "./InventarioDetailsGeneralSection";
import { InventarioApplyDosesSection } from "./InventarioApplyDosesSection";
import { updateInventarioSchema, type UpdateInventarioFormValues } from "../domain/inventario-vacunas.schemas";
import { useUpdateInventario } from "../mutations/useUpdateInventario";
import { useInventarioDetail } from "../queries/useInventarioDetail";
import { getInventarioErrorMessage } from "../utils/inventario-vacunas.feedback";

interface InventarioDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  itemSummary: InventarioVacunaListItem | null;
  canEdit: boolean;
  canApplyDoses?: boolean;
}

const DEFAULT_FORM_VALUES: UpdateInventarioFormValues = {
  stockQuantity: 0,
  isActive: true,
};

const FORM_ID = "inventario-details-form";

export function InventarioDetailsDialog({
  open,
  onOpenChange,
  onClose,
  itemSummary,
  canEdit,
  canApplyDoses = false,
}: InventarioDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } = useDetailsDialogCloseGuard(onOpenChange);

  const itemId = itemSummary?.id ?? null;

  const {
    data: detailResponse,
    isLoading,
    isError,
    error: detailError,
    refetch,
  } = useInventarioDetail(itemId, { enabled: open && itemId !== null });

  const detail = detailResponse?.inventario;
  const updateInventario = useUpdateInventario();

  const form = useForm<UpdateInventarioFormValues>({
    resolver: zodResolver(updateInventarioSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!detail || !open || isDirty) return;
    form.reset({ stockQuantity: detail.stockQuantity, isActive: detail.isActive });
  }, [detail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    if (detail) {
      form.reset({ stockQuantity: detail.stockQuantity, isActive: detail.isActive });
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError = open && !isClosing && (isError || (!isLoading && !detail));

  const handleSave = async (values: UpdateInventarioFormValues) => {
    if (!detail || !canEdit) return;

    const payload: UpdateInventarioVacunaRequest = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.stockQuantity) payload.stockQuantity = values.stockQuantity;
    if (dirtyFields.isActive) payload.isActive = values.isActive;

    if (Object.keys(payload).length === 0) return;

    try {
      await updateInventario.mutateAsync({ inventarioId: detail.id, data: payload });
      toast.success("Inventario actualizado", { description: "Los cambios se guardaron correctamente." });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", { description: getInventarioErrorMessage(error, "Error al guardar cambios") });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!detail || !canEdit) return;
    try {
      await updateInventario.mutateAsync({ inventarioId: detail.id, data: { isActive: nextActive } });
      toast.success(nextActive ? "Registro activado" : "Registro desactivado");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", { description: getInventarioErrorMessage(error, "Error al actualizar estado") });
    }
  };

  const title = detail
    ? `${detail.vaccine.name} — ${detail.center.name}`
    : itemSummary
      ? `${itemSummary.vaccine.name} — ${itemSummary.center.name}`
      : "Inventario";

  const isActive = detail?.isActive ?? itemSummary?.isActive;
  const statusBadge = typeof isActive === "boolean" ? <CatalogStatusBadge isActive={isActive} /> : null;

  const createdMeta = detail ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate">{`Creado por ${detail.createdBy?.name ?? "-"}`}</span>
    </span>
  ) : null;

  const updatedMeta = detail?.updatedAt ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <Pencil className="size-4 shrink-0" />
      <span className="truncate">{`Actualizado por ${detail.updatedBy?.name ?? "-"}`}</span>
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
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`skel-${i}`} className="h-12" />
        ))}
      </div>
    </div>
  );

  const errorContent = (
    <div className="rounded-2xl border border-line-struct bg-paper p-6 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-status-critical/10 text-status-critical">
        <AlertTriangle className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-txt-body">No se pudo cargar el registro</h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getInventarioErrorMessage(detailError, "Intenta nuevamente para ver el detalle.")}
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
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
              <InventarioDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                detail={detail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateInventario.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no tienes permisos para editar este registro." />
              ) : null}
            </>
          ),
        },
        {
          id: "aplicar-dosis",
          label: "Aplicar dosis",
          content: <InventarioApplyDosesSection detail={detail} canApply={canApplyDoses} />,
        },
      ]
    : [];

  return (
    <AdminDetailsDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      onRequestClose={closeDialog}
      titleSrOnly="Detalle de inventario de vacuna"
      descriptionSrOnly="Gestiona la existencia de vacunas en este centro de atención."
      header={
        itemSummary || detail ? (
          <InventarioDialogHeader
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
      dialogContentClassName="h-auto max-h-[90vh] w-[86vw] max-w-none rounded-3xl bg-paper p-0 sm:max-w-[920px]"
      footer={({ onCancel }) => (
        <CatalogDetailsFooter
          isDirty={isDirty}
          isSaving={updateInventario.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
