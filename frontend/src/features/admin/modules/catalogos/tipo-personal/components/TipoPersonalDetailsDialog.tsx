import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { TipoPersonalDetailsGeneralSection } from "@features/admin/modules/catalogos/tipo-personal/components/TipoPersonalDetailsGeneralSection";
import { TipoPersonalDialogHeader } from "@features/admin/modules/catalogos/tipo-personal/components/TipoPersonalDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  tipoPersonalDetailsSchema,
  type TipoPersonalDetailsFormValues,
} from "@features/admin/modules/catalogos/tipo-personal/domain/tipo-personal.schemas";
import { useUpdateTipoPersonal } from "@features/admin/modules/catalogos/tipo-personal/mutations/useUpdateTipoPersonal";
import { useTipoPersonalDetail } from "@features/admin/modules/catalogos/tipo-personal/queries/useTipoPersonalDetail";
import { getTipoPersonalErrorMessage } from "@features/admin/modules/catalogos/tipo-personal/utils/tipo-personal.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/tipo-personal/utils/tipo-personal.format";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { TipoPersonalListItem, UpdateTipoPersonalRequest } from "@api/types";

interface TipoPersonalDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  tipoPersonalSummary: TipoPersonalListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: TipoPersonalDetailsFormValues = {
  name: "",
};

const FORM_ID = "tipo-personal-details-form";

export function TipoPersonalDetailsDialog({
  open,
  onOpenChange,
  onClose,
  tipoPersonalSummary,
  canEdit,
}: TipoPersonalDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);

  const itemId = tipoPersonalSummary?.id;

  const {
    data: detailResponse,
    isLoading,
    isError,
    error: detailError,
    refetch,
  } = useTipoPersonalDetail(itemId, open && Boolean(itemId));

  const detail = detailResponse?.personalType;
  const updateTipoPersonal = useUpdateTipoPersonal();

  const form = useForm<TipoPersonalDetailsFormValues>({
    resolver: zodResolver(tipoPersonalDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!detail || !open || isDirty) return;
    form.reset({ name: detail.name ?? "" });
  }, [detail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    if (detail) {
      form.reset({ name: detail.name ?? "" });
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !detail));

  const handleSave = async (values: TipoPersonalDetailsFormValues) => {
    if (!detail || !canEdit) return;

    const payload: UpdateTipoPersonalRequest = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.name) payload.name = values.name;

    if (Object.keys(payload).length === 0) return;

    try {
      await updateTipoPersonal.mutateAsync({ id: detail.id, data: payload });
      toast.success("Tipo de personal actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getTipoPersonalErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!detail || !canEdit) return;

    try {
      await updateTipoPersonal.mutateAsync({
        id: detail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Tipo de personal activado" : "Tipo de personal desactivado");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoPersonalErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = detail?.name || tipoPersonalSummary?.name || "Tipo de personal";
  const isActive = detail?.isActive ?? tipoPersonalSummary?.isActive;

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
        No se pudo cargar el tipo de personal
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getTipoPersonalErrorMessage(
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
              <TipoPersonalDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                tipoPersonalDetail={detail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateTipoPersonal.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar este tipo de personal porque no tienes permisos." />
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
      titleSrOnly="Detalle de tipo de personal"
      descriptionSrOnly="Gestiona la configuracion de este tipo de personal."
      header={
        tipoPersonalSummary || detail ? (
          <TipoPersonalDialogHeader
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
          isSaving={updateTipoPersonal.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
