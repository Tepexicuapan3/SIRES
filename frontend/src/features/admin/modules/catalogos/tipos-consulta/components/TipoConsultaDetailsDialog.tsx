import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { TipoConsultaDetailsGeneralSection } from "@features/admin/modules/catalogos/tipos-consulta/components/TipoConsultaDetailsGeneralSection";
import { TipoConsultaDialogHeader } from "@features/admin/modules/catalogos/tipos-consulta/components/TipoConsultaDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  tipoConsultaDetailsSchema,
  type TipoConsultaDetailsFormValues,
} from "@features/admin/modules/catalogos/tipos-consulta/domain/tipos-consulta.schemas";
import { useUpdateTipoConsulta } from "@features/admin/modules/catalogos/tipos-consulta/mutations/useUpdateTipoConsulta";
import { useTipoConsultaDetail } from "@features/admin/modules/catalogos/tipos-consulta/queries/useTipoConsultaDetail";
import { getTipoConsultaErrorMessage } from "@features/admin/modules/catalogos/tipos-consulta/utils/tipos-consulta.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/tipos-consulta/utils/tipos-consulta.format";
import {
  mapTipoConsultaDetailToFormValues,
  buildUpdateTipoConsultaPayload,
} from "@features/admin/modules/catalogos/tipos-consulta/utils/tipos-consulta.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { TipoConsultaListItem } from "@api/types";

interface TipoConsultaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  tipoConsultaSummary: TipoConsultaListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: TipoConsultaDetailsFormValues = {
  name: "",
};

const FORM_ID = "tipo-consulta-details-form";

export function TipoConsultaDetailsDialog({
  open,
  onOpenChange,
  onClose,
  tipoConsultaSummary,
  canEdit,
}: TipoConsultaDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const tipoConsultaId = tipoConsultaSummary?.id;
  const {
    data: tipoConsultaDetailResponse,
    isLoading,
    isError,
    error: tipoConsultaDetailError,
    refetch,
  } = useTipoConsultaDetail(tipoConsultaId, open && Boolean(tipoConsultaId));

  const tipoConsultaDetail = tipoConsultaDetailResponse?.consultationType;
  const updateTipoConsulta = useUpdateTipoConsulta();

  const form = useForm<TipoConsultaDetailsFormValues>({
    resolver: zodResolver(tipoConsultaDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!tipoConsultaDetail || !open || isDirty) return;
    form.reset(mapTipoConsultaDetailToFormValues(tipoConsultaDetail));
  }, [tipoConsultaDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      tipoConsultaDetail
        ? mapTipoConsultaDetailToFormValues(tipoConsultaDetail)
        : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !tipoConsultaDetail));
  const readOnlyMessage =
    "Solo lectura: no puedes actualizar este tipo de consulta porque no tienes permisos.";

  const handleSave = async (values: TipoConsultaDetailsFormValues) => {
    if (!tipoConsultaDetail || !canEdit) return;
    const payload = buildUpdateTipoConsultaPayload(
      values,
      form.formState.dirtyFields,
    );

    if (Object.keys(payload).length === 0) return;

    try {
      await updateTipoConsulta.mutateAsync({
        id: tipoConsultaDetail.id,
        data: payload,
      });
      toast.success("Tipo de consulta actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getTipoConsultaErrorMessage(
          error,
          "Error al guardar cambios",
        ),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!tipoConsultaDetail || !canEdit) return;

    try {
      await updateTipoConsulta.mutateAsync({
        id: tipoConsultaDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(
        nextActive ? "Tipo de consulta activado" : "Tipo de consulta desactivado",
      );
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoConsultaErrorMessage(
          error,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const title =
    tipoConsultaDetail?.name || tipoConsultaSummary?.name || "Tipo de consulta";
  const isActive = tipoConsultaDetail?.isActive ?? tipoConsultaSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = tipoConsultaDetail
    ? `Creado ${formatDate(tipoConsultaDetail.createdAt)} por ${tipoConsultaDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = tipoConsultaDetail?.updatedAt
    ? `Actualizado ${formatDateTime(tipoConsultaDetail.updatedAt)} por ${tipoConsultaDetail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar el tipo de consulta
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getTipoConsultaErrorMessage(
          tipoConsultaDetailError,
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

  const sections: AdminDetailsDialogSection[] = tipoConsultaDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <TipoConsultaDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                tipoConsultaDetail={tipoConsultaDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateTipoConsulta.isPending}
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
      titleSrOnly="Detalle de tipo de consulta"
      descriptionSrOnly="Gestiona la configuracion de este tipo de consulta."
      header={
        tipoConsultaSummary || tipoConsultaDetail ? (
          <TipoConsultaDialogHeader
            title={title}
            status={statusBadge}
            meta={
              tipoConsultaDetail ? (
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
          isSaving={updateTipoConsulta.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
