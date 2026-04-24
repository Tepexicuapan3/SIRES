import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { ConsultorioDetailsGeneralSection } from "@features/admin/modules/catalogos/consultorios/components/ConsultorioDetailsGeneralSection";
import { ConsultorioDialogHeader } from "@features/admin/modules/catalogos/consultorios/components/ConsultorioDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  consultorioDetailsSchema,
  type ConsultorioDetailsFormValues,
} from "@features/admin/modules/catalogos/consultorios/domain/consultorios.schemas";
import { useUpdateConsultorio } from "@features/admin/modules/catalogos/consultorios/mutations/useUpdateConsultorio";
import { useConsultorioDetail } from "@features/admin/modules/catalogos/consultorios/queries/useConsultorioDetail";
import { getConsultorioErrorMessage } from "@features/admin/modules/catalogos/consultorios/utils/consultorios.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/consultorios/utils/consultorios.format";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { ConsultorioListItem, UpdateConsultorioRequest } from "@api/types";

interface ConsultorioDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  consultorioSummary: ConsultorioListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: ConsultorioDetailsFormValues = {
  name: "",
  code: "",
  idTurn: 0,
  idCenter: 0,
};

const FORM_ID = "consultorio-details-form";

export function ConsultorioDetailsDialog({
  open,
  onOpenChange,
  onClose,
  consultorioSummary,
  canEdit,
}: ConsultorioDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const consultorioId = consultorioSummary?.id;
  const {
    data: consultorioDetailResponse,
    isLoading,
    isError,
    error: consultorioDetailError,
    refetch,
  } = useConsultorioDetail(consultorioId, open && Boolean(consultorioId));

  const consultorioDetail = consultorioDetailResponse?.consultingRoom;
  const updateConsultorio = useUpdateConsultorio();

  const form = useForm<ConsultorioDetailsFormValues>({
    resolver: zodResolver(consultorioDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!consultorioDetail || !open || isDirty) return;
    form.reset({
      name: consultorioDetail.name ?? "",
      code: String(consultorioDetail.code ?? ""),
      idTurn: consultorioDetail.turn?.id ?? 0,
      idCenter: consultorioDetail.center?.id ?? 0,
    });
  }, [consultorioDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    if (consultorioDetail) {
      form.reset({
        name: consultorioDetail.name ?? "",
        code: String(consultorioDetail.code ?? ""),
        idTurn: consultorioDetail.turn?.id ?? 0,
        idCenter: consultorioDetail.center?.id ?? 0,
      });
    } else {
      form.reset(DEFAULT_FORM_VALUES);
    }

    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !consultorioDetail));
  const readOnlyConsultorioMessage =
    "Solo lectura: no puedes actualizar este consultorio porque no tienes permisos.";

  const handleSave = async (values: ConsultorioDetailsFormValues) => {
    if (!consultorioDetail || !canEdit) return;
    const payload: UpdateConsultorioRequest = {};
    const { dirtyFields } = form.formState;

    if (dirtyFields.name) payload.name = values.name;
    if (dirtyFields.code) payload.code = Number(values.code);
    if (dirtyFields.idTurn) payload.idTurn = values.idTurn;
    if (dirtyFields.idCenter) payload.idCenter = values.idCenter;

    if (Object.keys(payload).length === 0) return;

    try {
      await updateConsultorio.mutateAsync({
        consultorioId: consultorioDetail.id,
        data: payload,
      });
      toast.success("Consultorio actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getConsultorioErrorMessage(
          error,
          "Error al guardar cambios",
        ),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!consultorioDetail || !canEdit) return;

    try {
      await updateConsultorio.mutateAsync({
        consultorioId: consultorioDetail.id,
        data: { isActive: nextActive },
      });

      toast.success(
        nextActive ? "Consultorio activado" : "Consultorio desactivado",
      );
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getConsultorioErrorMessage(
          error,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const title =
    consultorioDetail?.name || consultorioSummary?.name || "Consultorio";
  const subtitle =
    consultorioDetail?.code?.toString() ||
    consultorioSummary?.code?.toString() ||
    null;
  const isActive = consultorioDetail?.isActive ?? consultorioSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = consultorioDetail
    ? `Creado ${formatDate(consultorioDetail.createdAt)} por ${consultorioDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = consultorioDetail?.updatedAt
    ? `Actualizado ${formatDateTime(consultorioDetail.updatedAt)} por ${consultorioDetail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar el consultorio
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getConsultorioErrorMessage(
          consultorioDetailError,
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

  const sections: AdminDetailsDialogSection[] = consultorioDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <ConsultorioDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                consultorioDetail={consultorioDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateConsultorio.isPending}
                isEditable={canEdit}
              />
              {!canEdit ? (
                <AdminReadOnlyNotice message={readOnlyConsultorioMessage} />
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
      titleSrOnly="Detalle de consultorio"
      descriptionSrOnly="Gestiona la configuracion de este consultorio."
      header={
        consultorioSummary || consultorioDetail ? (
          <ConsultorioDialogHeader
            title={title}
            subtitle={subtitle}
            status={statusBadge}
            meta={
              consultorioDetail ? (
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
          isSaving={updateConsultorio.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
