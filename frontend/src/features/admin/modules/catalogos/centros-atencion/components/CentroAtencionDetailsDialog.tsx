import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { CentroAtencionDetailsGeneralSection } from "@features/admin/modules/catalogos/centros-atencion/components/CentroAtencionDetailsGeneralSection";
import { CentroAtencionDialogHeader } from "@features/admin/modules/catalogos/centros-atencion/components/CentroAtencionDialogHeader";
import {
  centroAtencionDetailsSchema,
  type CentroAtencionDetailsFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/domain/centros-atencion.schemas";
import { useCentroAtencionDetail } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentroAtencionDetail";
import { useUpdateCentroAtencion } from "@features/admin/modules/catalogos/centros-atencion/mutations/useUpdateCentroAtencion";
import { getCentroAtencionErrorMessage } from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.format";
import {
  buildUpdateCentroAtencionPayload,
  mapCentroAtencionDetailToFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.transform";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { CentroAtencionListItem } from "@api/types";

interface CentroAtencionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  centerSummary: CentroAtencionListItem | null;
  canEdit: boolean;
}

const FORM_ID = "centro-atencion-details-form";

const DEFAULT_FORM_VALUES: CentroAtencionDetailsFormValues = {
  name: "",
  code: "",
  centerType: "CLINICA",
  legacyFolio: null,
  isExternal: false,
  address: null,
  postalCode: null,
  neighborhood: null,
  municipality: null,
  state: null,
  city: null,
  phone: null,
  isActive: true,
};

export function CentroAtencionDetailsDialog({
  open,
  onOpenChange,
  onClose,
  centerSummary,
  canEdit,
}: CentroAtencionDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);

  const centerId = centerSummary?.id;

  const {
    data: centerDetailResponse,
    isLoading,
    isError,
    error: centerDetailError,
    refetch,
  } = useCentroAtencionDetail(centerId, open && Boolean(centerId));

  const centerDetail = centerDetailResponse?.careCenter;
  const updateCenter = useUpdateCentroAtencion();

  const form = useForm<CentroAtencionDetailsFormValues>({
    resolver: zodResolver(centroAtencionDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!centerDetail || !open || isDirty) return;
    form.reset(mapCentroAtencionDetailToFormValues(centerDetail));
  }, [centerDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();

    if (centerDetail) {
      form.reset(mapCentroAtencionDetailToFormValues(centerDetail));
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }

    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !centerDetail));

  const readOnlyCenterMessage =
    "Solo lectura: no puedes actualizar este centro porque no tienes permisos.";

  const handleSave = async (values: CentroAtencionDetailsFormValues) => {
    if (!centerDetail || !canEdit) return;

    const payload = buildUpdateCentroAtencionPayload(
      values,
      form.formState.dirtyFields as Partial<
        Record<keyof CentroAtencionDetailsFormValues, boolean>
      >,
    );

    if (Object.keys(payload).length === 0) return;

    try {
      await updateCenter.mutateAsync({
        centerId: centerDetail.id,
        data: payload,
      });

      toast.success("Centro actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });

      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getCentroAtencionErrorMessage(
          error,
          "Error al guardar cambios",
        ),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!centerDetail || !canEdit) return;

    try {
      await updateCenter.mutateAsync({
        centerId: centerDetail.id,
        data: { isActive: nextActive },
      });

      toast.success(nextActive ? "Centro activado" : "Centro desactivado");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getCentroAtencionErrorMessage(
          error,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const title = centerDetail?.name || centerSummary?.name || "Centro";
  const subtitle =
    centerDetail?.code ||
    centerSummary?.code ||
    centerDetail?.legacyFolio ||
    centerSummary?.legacyFolio ||
    null;

  const isActive = centerDetail?.isActive ?? centerSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = centerDetail?.createdAt
    ? `Creado ${formatDate(centerDetail.createdAt)} por ${centerDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = centerDetail?.updatedAt
    ? `Actualizado ${formatDateTime(centerDetail.updatedAt)} por ${centerDetail.updatedBy?.name ?? "-"}`
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
        {Array.from({ length: 8 }).map((_, index) => (
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
        No se pudo cargar el centro
      </h3>

      <p className="mt-1 text-sm text-txt-muted">
        {getCentroAtencionErrorMessage(
          centerDetailError,
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

  const sections: AdminDetailsDialogSection[] = centerDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <CentroAtencionDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                centerDetail={centerDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateCenter.isPending}
                isEditable={canEdit}
              />

              {!canEdit ? (
                <AdminReadOnlyNotice message={readOnlyCenterMessage} />
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
      titleSrOnly="Detalle de centro de atencion"
      descriptionSrOnly="Gestiona la configuracion de este centro de atencion."
      header={
        centerSummary || centerDetail ? (
          <CentroAtencionDialogHeader
            title={title}
            subtitle={subtitle}
            status={statusBadge}
            meta={
              centerDetail ? (
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
      dialogContentClassName="h-auto max-h-[90vh] w-[90vw] max-w-none rounded-3xl bg-paper p-0 sm:max-w-[980px]"
      footer={({ onCancel }) => (
        <CatalogDetailsFooter
          isDirty={isDirty}
          isSaving={updateCenter.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}