import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaDetailsGeneralSection } from "@features/admin/modules/catalogos/areas/components/AreaDetailsGeneralSection";
import { AreaDialogHeader } from "@features/admin/modules/catalogos/areas/components/AreaDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  areaDetailsSchema,
  type AreaDetailsFormValues,
} from "@features/admin/modules/catalogos/areas/domain/areas.schemas";
import { useUpdateArea } from "@features/admin/modules/catalogos/areas/mutations/useUpdateArea";
import { useAreaDetail } from "@features/admin/modules/catalogos/areas/queries/useAreaDetail";
import { getAreaErrorMessage } from "@features/admin/modules/catalogos/areas/utils/areas.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/areas/utils/areas.format";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { AreaListItem, UpdateAreaRequest } from "@api/types";

interface AreaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  areaSummary: AreaListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: AreaDetailsFormValues = {
  name: "",
  code: "",
};

const FORM_ID = "area-details-form";

export function AreaDetailsDialog({
  open,
  onOpenChange,
  onClose,
  areaSummary,
  canEdit,
}: AreaDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const areaId = areaSummary?.id;
  const {
    data: areaDetailResponse,
    isLoading,
    isError,
    error: areaDetailError,
    refetch,
  } = useAreaDetail(areaId, open && Boolean(areaId));

  const areaDetail = areaDetailResponse?.area;
  const updateArea = useUpdateArea();

  const form = useForm<AreaDetailsFormValues>({
    resolver: zodResolver(areaDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!areaDetail || !open || isDirty) return;
    form.reset({
      name: areaDetail.name ?? "",
      code: areaDetail.code ?? "",
    });
  }, [areaDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    if (areaDetail) {
      form.reset({
        name: areaDetail.name ?? "",
        code: areaDetail.code ?? "",
      });
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }

    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !areaDetail));

  const handleSave = async (values: AreaDetailsFormValues) => {
    if (!areaDetail || !canEdit) return;
    const payload: UpdateAreaRequest = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.name) payload.name = values.name;
    if (dirtyFields.code) payload.code = values.code;

    if (Object.keys(payload).length === 0) return;

    try {
      await updateArea.mutateAsync({ areaId: areaDetail.id, data: payload });
      toast.success("Area actualizada", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getAreaErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!areaDetail || !canEdit) return;

    try {
      await updateArea.mutateAsync({
        areaId: areaDetail.id,
        data: { isActive: nextActive },
      });

      toast.success(nextActive ? "Area activada" : "Area desactivada");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getAreaErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = areaDetail?.name || areaSummary?.name || "Area";
  const subtitle = areaDetail?.code || areaSummary?.code || null;
  const isActive = areaDetail?.isActive ?? areaSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = areaDetail
    ? `Creado ${formatDate(areaDetail.createdAt)} por ${areaDetail.createdBy.name}`
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
        No se pudo cargar el area
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getAreaErrorMessage(
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
              <AreaDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                areaDetail={areaDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateArea.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <div className="rounded-xl border border-line-struct bg-subtle/40 px-4 py-3 text-xs text-txt-muted">
                  Solo lectura: no tienes permisos para modificar esta area.
                </div>
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
      titleSrOnly="Detalle de area"
      descriptionSrOnly="Gestiona la configuracion de esta area."
      header={
        areaSummary || areaDetail ? (
          <AreaDialogHeader
            title={title}
            subtitle={subtitle}
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
