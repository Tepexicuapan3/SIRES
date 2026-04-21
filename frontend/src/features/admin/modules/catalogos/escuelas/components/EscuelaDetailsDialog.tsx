import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { EscuelaDetailsGeneralSection } from "@features/admin/modules/catalogos/escuelas/components/EscuelaDetailsGeneralSection";
import { EscuelaDialogHeader } from "@features/admin/modules/catalogos/escuelas/components/EscuelaDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  escuelaDetailsSchema,
  type EscuelaDetailsFormValues,
} from "@features/admin/modules/catalogos/escuelas/domain/escuelas.schemas";
import { useUpdateEscuela } from "@features/admin/modules/catalogos/escuelas/mutations/useUpdateEscuela";
import { useEscuelaDetail } from "@features/admin/modules/catalogos/escuelas/queries/useEscuelaDetail";
import { getEscuelaErrorMessage } from "@features/admin/modules/catalogos/escuelas/utils/escuelas.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/escuelas/utils/escuelas.format";
import {
  mapEscuelaDetailToFormValues,
  buildUpdateEscuelaPayload,
} from "@features/admin/modules/catalogos/escuelas/utils/escuelas.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { EscuelaListItem } from "@api/types";

interface EscuelaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  escuelaSummary: EscuelaListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: EscuelaDetailsFormValues = {
  name: "",
  code: "",
};

const FORM_ID = "escuela-details-form";

export function EscuelaDetailsDialog({
  open,
  onOpenChange,
  onClose,
  escuelaSummary,
  canEdit,
}: EscuelaDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const escuelaId = escuelaSummary?.id;
  const {
    data: escuelaDetailResponse,
    isLoading,
    isError,
    error: escuelaDetailError,
    refetch,
  } = useEscuelaDetail(escuelaId, open && Boolean(escuelaId));

  const escuelaDetail = escuelaDetailResponse?.school;
  const updateEscuela = useUpdateEscuela();

  const form = useForm<EscuelaDetailsFormValues>({
    resolver: zodResolver(escuelaDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!escuelaDetail || !open || isDirty) return;
    form.reset(mapEscuelaDetailToFormValues(escuelaDetail));
  }, [escuelaDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      escuelaDetail
        ? mapEscuelaDetailToFormValues(escuelaDetail)
        : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !escuelaDetail));
  const readOnlyMessage =
    "Solo lectura: no puedes actualizar esta escuela porque no tienes permisos.";

  const handleSave = async (values: EscuelaDetailsFormValues) => {
    if (!escuelaDetail || !canEdit) return;
    const payload = buildUpdateEscuelaPayload(values, form.formState.dirtyFields);

    if (Object.keys(payload).length === 0) return;

    try {
      await updateEscuela.mutateAsync({ id: escuelaDetail.id, data: payload });
      toast.success("Escuela actualizada", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getEscuelaErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!escuelaDetail || !canEdit) return;

    try {
      await updateEscuela.mutateAsync({
        id: escuelaDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Escuela activada" : "Escuela desactivada");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getEscuelaErrorMessage(
          error,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const title = escuelaDetail?.name || escuelaSummary?.name || "Escuela";
  const subtitle = escuelaDetail?.code || escuelaSummary?.code || null;
  const isActive = escuelaDetail?.isActive ?? escuelaSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = escuelaDetail
    ? `Creado ${formatDate(escuelaDetail.createdAt)} por ${escuelaDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = escuelaDetail?.updatedAt
    ? `Actualizado ${formatDateTime(escuelaDetail.updatedAt)} por ${escuelaDetail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar la escuela
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getEscuelaErrorMessage(
          escuelaDetailError,
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

  const sections: AdminDetailsDialogSection[] = escuelaDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <EscuelaDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                escuelaDetail={escuelaDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateEscuela.isPending}
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
      titleSrOnly="Detalle de escuela"
      descriptionSrOnly="Gestiona la configuracion de esta escuela."
      header={
        escuelaSummary || escuelaDetail ? (
          <EscuelaDialogHeader
            title={title}
            subtitle={subtitle}
            status={statusBadge}
            meta={
              escuelaDetail ? (
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
          isSaving={updateEscuela.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
