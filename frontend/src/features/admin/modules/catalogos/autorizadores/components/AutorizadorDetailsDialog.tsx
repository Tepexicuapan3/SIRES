import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { AutorizadorDetailsGeneralSection } from "@features/admin/modules/catalogos/autorizadores/components/AutorizadorDetailsGeneralSection";
import { AutorizadorDialogHeader } from "@features/admin/modules/catalogos/autorizadores/components/AutorizadorDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  autorizadorDetailsSchema,
  type AutorizadorDetailsFormValues,
} from "@features/admin/modules/catalogos/autorizadores/domain/autorizadores.schemas";
import {
  mapAutorizadorDetailToFormValues,
  buildUpdateAutorizadorPayload,
} from "@features/admin/modules/catalogos/autorizadores/utils/autorizadores.transform";
import { useUpdateAutorizador } from "@features/admin/modules/catalogos/autorizadores/mutations/useUpdateAutorizador";
import { useAutorizadorDetail } from "@features/admin/modules/catalogos/autorizadores/queries/useAutorizadorDetail";
import { getAutorizadorErrorMessage } from "@features/admin/modules/catalogos/autorizadores/utils/autorizadores.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/autorizadores/utils/autorizadores.format";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { AutorizadorListItem } from "@api/types";

interface AutorizadorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  autorizadorSummary: AutorizadorListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: AutorizadorDetailsFormValues = {
  name: "",
  position: "",
  centerId: 0,
  authorizationTypeId: 0,
  userId: 0,
  authorizerPassword: "",
  fileNumber: "",
  signatureImage: "",
};

const FORM_ID = "autorizador-details-form";

export function AutorizadorDetailsDialog({
  open,
  onOpenChange,
  onClose,
  autorizadorSummary,
  canEdit,
}: AutorizadorDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);

  const itemId = autorizadorSummary?.id;

  const {
    data: detailResponse,
    isLoading,
    isError,
    error: detailError,
    refetch,
  } = useAutorizadorDetail(itemId, open && Boolean(itemId));

  const detail = detailResponse?.authorizer;
  const updateAutorizador = useUpdateAutorizador();

  const form = useForm<AutorizadorDetailsFormValues>({
    resolver: zodResolver(autorizadorDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!detail || !open || isDirty) return;
    form.reset(mapAutorizadorDetailToFormValues(detail));
  }, [detail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      detail ? mapAutorizadorDetailToFormValues(detail) : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !detail));

  const handleSave = async (values: AutorizadorDetailsFormValues) => {
    if (!detail || !canEdit) return;

    const payload = buildUpdateAutorizadorPayload(values, form.formState.dirtyFields);

    if (Object.keys(payload).length === 0) return;

    try {
      await updateAutorizador.mutateAsync({ id: detail.id, data: payload });
      toast.success("Autorizador actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset({ ...values, authorizerPassword: "" });
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getAutorizadorErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!detail || !canEdit) return;

    try {
      await updateAutorizador.mutateAsync({
        id: detail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Autorizador activado" : "Autorizador desactivado");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getAutorizadorErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = detail?.name || autorizadorSummary?.name || "Autorizador";
  const isActive = detail?.isActive ?? autorizadorSummary?.isActive;

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
        No se pudo cargar el autorizador
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getAutorizadorErrorMessage(
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
              <AutorizadorDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                autorizadorDetail={detail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateAutorizador.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar este autorizador porque no tienes permisos." />
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
      titleSrOnly="Detalle de autorizador"
      descriptionSrOnly="Gestiona la configuracion de este autorizador."
      header={
        autorizadorSummary || detail ? (
          <AutorizadorDialogHeader
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
          isSaving={updateAutorizador.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
