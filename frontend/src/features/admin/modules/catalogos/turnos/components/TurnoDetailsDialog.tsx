import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { TurnoDetailsGeneralSection } from "@features/admin/modules/catalogos/turnos/components/TurnoDetailsGeneralSection";
import { TurnoDialogHeader } from "@features/admin/modules/catalogos/turnos/components/TurnoDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  turnoDetailsSchema,
  type TurnoDetailsFormValues,
} from "@features/admin/modules/catalogos/turnos/domain/turnos.schemas";
import { useUpdateTurno } from "@features/admin/modules/catalogos/turnos/mutations/useUpdateTurno";
import { useTurnoDetail } from "@features/admin/modules/catalogos/turnos/queries/useTurnoDetail";
import { getTurnoErrorMessage } from "@features/admin/modules/catalogos/turnos/utils/turnos.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/turnos/utils/turnos.format";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { TurnoListItem, UpdateTurnoRequest } from "@api/types";

interface TurnoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  turnoSummary: TurnoListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: TurnoDetailsFormValues = {
  name: "",
};

const FORM_ID = "turno-details-form";

export function TurnoDetailsDialog({
  open,
  onOpenChange,
  onClose,
  turnoSummary,
  canEdit,
}: TurnoDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);

  const turnoId = turnoSummary?.id;

  const {
    data: turnoDetailResponse,
    isLoading,
    isError,
    error: turnoDetailError,
    refetch,
  } = useTurnoDetail(turnoId, open && Boolean(turnoId));

  const turnoDetail = turnoDetailResponse?.shift;
  const updateTurno = useUpdateTurno();

  const form = useForm<TurnoDetailsFormValues>({
    resolver: zodResolver(turnoDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!turnoDetail || !open || isDirty) return;
    form.reset({ name: turnoDetail.name ?? "" });
  }, [turnoDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    if (turnoDetail) {
      form.reset({ name: turnoDetail.name ?? "" });
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !turnoDetail));

  const handleSave = async (values: TurnoDetailsFormValues) => {
    if (!turnoDetail || !canEdit) return;

    const payload: UpdateTurnoRequest = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.name) payload.name = values.name;

    if (Object.keys(payload).length === 0) return;

    try {
      await updateTurno.mutateAsync({ turnoId: turnoDetail.id, data: payload });
      toast.success("Turno actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getTurnoErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!turnoDetail || !canEdit) return;

    try {
      await updateTurno.mutateAsync({
        turnoId: turnoDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Turno activado" : "Turno desactivado");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getTurnoErrorMessage(error, "Error al actualizar estado"),
      });
    }
  };

  const title = turnoDetail?.name || turnoSummary?.name || "Turno";
  const isActive = turnoDetail?.isActive ?? turnoSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = turnoDetail
    ? `Creado ${formatDate(turnoDetail.createdAt)} por ${turnoDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = turnoDetail?.updatedAt
    ? `Actualizado ${formatDateTime(turnoDetail.updatedAt)} por ${turnoDetail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar el turno
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getTurnoErrorMessage(
          turnoDetailError,
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

  const sections: AdminDetailsDialogSection[] = turnoDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <TurnoDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                turnoDetail={turnoDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateTurno.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar este turno porque no tienes permisos." />
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
      titleSrOnly="Detalle de turno"
      descriptionSrOnly="Gestiona la configuracion de este turno."
      header={
        turnoSummary || turnoDetail ? (
          <TurnoDialogHeader
            title={title}
            status={statusBadge}
            meta={
              turnoDetail ? (
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
          isSaving={updateTurno.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
