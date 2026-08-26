import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { GrupoMedicamentosDetailsGeneralSection } from "@features/admin/modules/catalogos/grupos-medicamentos/components/GrupoMedicamentosDetailsGeneralSection";
import { GrupoMedicamentosDialogHeader } from "@features/admin/modules/catalogos/grupos-medicamentos/components/GrupoMedicamentosDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  grupoMedicamentosDetailsSchema,
  type GrupoMedicamentosDetailsFormValues,
} from "@features/admin/modules/catalogos/grupos-medicamentos/domain/grupos-medicamentos.schemas";
import { useUpdateGrupoMedicamentos } from "@features/admin/modules/catalogos/grupos-medicamentos/mutations/useUpdateGrupoMedicamentos";
import { useGrupoMedicamentosDetail } from "@features/admin/modules/catalogos/grupos-medicamentos/queries/useGrupoMedicamentosDetail";
import { getGrupoMedicamentosErrorMessage } from "@features/admin/modules/catalogos/grupos-medicamentos/utils/grupos-medicamentos.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/grupos-medicamentos/utils/grupos-medicamentos.format";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { GrupoMedicamentosListItem, UpdateGrupoMedicamentosRequest } from "@api/types";

interface GrupoMedicamentosDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  grupoMedicamentosSummary: GrupoMedicamentosListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: GrupoMedicamentosDetailsFormValues = {
  name: "",
};

const FORM_ID = "grupo-medicamentos-details-form";

export function GrupoMedicamentosDetailsDialog({
  open,
  onOpenChange,
  onClose,
  grupoMedicamentosSummary,
  canEdit,
}: GrupoMedicamentosDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);

  const itemId = grupoMedicamentosSummary?.id;

  const {
    data: detailResponse,
    isLoading,
    isError,
    error: detailError,
    refetch,
  } = useGrupoMedicamentosDetail(itemId, open && Boolean(itemId));

  const detail = detailResponse?.medicationGroup;
  const updateGrupoMedicamentos = useUpdateGrupoMedicamentos();

  const form = useForm<GrupoMedicamentosDetailsFormValues>({
    resolver: zodResolver(grupoMedicamentosDetailsSchema),
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

  const handleSave = async (values: GrupoMedicamentosDetailsFormValues) => {
    if (!detail || !canEdit) return;

    const payload: UpdateGrupoMedicamentosRequest = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.name) payload.name = values.name;

    if (Object.keys(payload).length === 0) return;

    try {
      await updateGrupoMedicamentos.mutateAsync({ id: detail.id, data: payload });
      toast.success("Grupo de medicamentos actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getGrupoMedicamentosErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!detail || !canEdit) return;

    try {
      await updateGrupoMedicamentos.mutateAsync({
        id: detail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Grupo de medicamentos activado" : "Grupo de medicamentos desactivado");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getGrupoMedicamentosErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = detail?.name || grupoMedicamentosSummary?.name || "Grupo de medicamentos";
  const isActive = detail?.isActive ?? grupoMedicamentosSummary?.isActive;

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
        No se pudo cargar el grupo de medicamentos
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getGrupoMedicamentosErrorMessage(
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
              <GrupoMedicamentosDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                grupoMedicamentosDetail={detail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateGrupoMedicamentos.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar este grupo de medicamentos porque no tienes permisos." />
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
      titleSrOnly="Detalle de grupo de medicamentos"
      descriptionSrOnly="Gestiona la configuracion de este grupo de medicamentos."
      header={
        grupoMedicamentosSummary || detail ? (
          <GrupoMedicamentosDialogHeader
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
          isSaving={updateGrupoMedicamentos.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
