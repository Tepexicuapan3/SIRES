import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { AreaClinicaDetailsGeneralSection } from "@features/admin/modules/catalogos/areas-clinicas/components/AreaClinicaDetailsGeneralSection";
import { AreaClinicaDialogHeader } from "@features/admin/modules/catalogos/areas-clinicas/components/AreaClinicaDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  areaClinicaDetailsSchema,
  type AreaClinicaDetailsFormValues,
} from "@features/admin/modules/catalogos/areas-clinicas/domain/areas-clinicas.schemas";
import { useUpdateAreaClinica } from "@features/admin/modules/catalogos/areas-clinicas/mutations/useUpdateAreaClinica";
import { useAreaClinicaDetail } from "@features/admin/modules/catalogos/areas-clinicas/queries/useAreaClinicaDetail";
import { getAreaClinicaErrorMessage } from "@features/admin/modules/catalogos/areas-clinicas/utils/areas-clinicas.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/areas-clinicas/utils/areas-clinicas.format";
import {
  mapAreaClinicaDetailToFormValues,
  buildUpdateAreaClinicaPayload,
} from "@features/admin/modules/catalogos/areas-clinicas/utils/areas-clinicas.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { AreaClinicaListItem } from "@api/types";

interface AreaClinicaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  areaSummary: AreaClinicaListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: AreaClinicaDetailsFormValues = {
  name: "",
};

const FORM_ID = "area-clinica-details-form";

export function AreaClinicaDetailsDialog({
  open,
  onOpenChange,
  onClose,
  areaSummary,
  canEdit,
}: AreaClinicaDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);

  const areaId = areaSummary?.id;

  const {
    data: areaDetailResponse,
    isLoading,
    isError,
    error: areaDetailError,
    refetch,
  } = useAreaClinicaDetail(areaId, open && Boolean(areaId));

  const areaDetail = areaDetailResponse?.clinicalArea;
  const updateArea = useUpdateAreaClinica();

  const form = useForm<AreaClinicaDetailsFormValues>({
    resolver: zodResolver(areaClinicaDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!areaDetail || !open || isDirty) return;
    form.reset(mapAreaClinicaDetailToFormValues(areaDetail));
  }, [areaDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      areaDetail ? mapAreaClinicaDetailToFormValues(areaDetail) : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !areaDetail));

  const handleSave = async (values: AreaClinicaDetailsFormValues) => {
    if (!areaDetail || !canEdit) return;

    const payload = buildUpdateAreaClinicaPayload(values, form.formState.dirtyFields);

    if (Object.keys(payload).length === 0) return;

    try {
      await updateArea.mutateAsync({ id: areaDetail.id, data: payload });
      toast.success("Área clínica actualizada", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getAreaClinicaErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!areaDetail || !canEdit) return;

    try {
      await updateArea.mutateAsync({
        id: areaDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Área clínica activada" : "Área clínica desactivada");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getAreaClinicaErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = areaDetail?.name || areaSummary?.name || "Área clínica";
  const isActive = areaDetail?.isActive ?? areaSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = areaDetail
    ? `Creado ${formatDate(areaDetail.createdAt)} por ${areaDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = areaDetail?.updatedAt
    ? `Actualizado ${formatDateTime(areaDetail.updatedAt)} por ${areaDetail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar el área clínica
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getAreaClinicaErrorMessage(
          areaDetailError,
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

  const sections: AdminDetailsDialogSection[] = areaDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <AreaClinicaDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                areaDetail={areaDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateArea.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar esta área clínica porque no tienes permisos." />
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
      titleSrOnly="Detalle de área clínica"
      descriptionSrOnly="Gestiona la configuración de esta área clínica."
      header={
        areaSummary || areaDetail ? (
          <AreaClinicaDialogHeader
            title={title}
            status={statusBadge}
            meta={
              areaDetail ? (
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
          isSaving={updateArea.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
