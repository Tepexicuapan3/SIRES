import { useEffect } from "react";
import { AlertTriangle, CalendarDays, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { EdoCivilDetailsGeneralSection } from "@features/admin/modules/catalogos/edo-civil/components/EdoCivilDetailsGeneralSection";
import { EdoCivilDialogHeader } from "@features/admin/modules/catalogos/edo-civil/components/EdoCivilDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  edoCivilDetailsSchema,
  type EdoCivilDetailsFormValues,
} from "@features/admin/modules/catalogos/edo-civil/domain/edoCivil.schemas";
import { useUpdateEdoCivil } from "@features/admin/modules/catalogos/edo-civil/mutations/useUpdateEdoCivil";
import { useEdoCivilDetail } from "@features/admin/modules/catalogos/edo-civil/queries/useEdoCivilDetail";
import { getEdoCivilErrorMessage } from "@features/admin/modules/catalogos/edo-civil/utils/edoCivil.feedback";
import {
  formatDate,
  formatDateTime,
} from "@features/admin/modules/catalogos/edo-civil/utils/edoCivil.format";
import {
  mapEdoCivilDetailToFormValues,
  buildUpdateEdoCivilPayload,
} from "@features/admin/modules/catalogos/edo-civil/utils/edoCivil.transform";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AdminDetailsDialogSection } from "@features/admin/shared/types/details-dialog.types";
import type { EdoCivilListItem } from "@api/types";

interface EdoCivilDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  edoCivilSummary: EdoCivilListItem | null;
  canEdit: boolean;
}

const DEFAULT_FORM_VALUES: EdoCivilDetailsFormValues = {
  name: "",
};

const FORM_ID = "edo-civil-details-form";

export function EdoCivilDetailsDialog({
  open,
  onOpenChange,
  onClose,
  edoCivilSummary,
  canEdit,
}: EdoCivilDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const edoCivilId = edoCivilSummary?.id;
  const {
    data: edoCivilDetailResponse,
    isLoading,
    isError,
    error: edoCivilDetailError,
    refetch,
  } = useEdoCivilDetail(edoCivilId, open && Boolean(edoCivilId));

  const edoCivilDetail = edoCivilDetailResponse?.civilStatus;
  const updateEdoCivil = useUpdateEdoCivil();

  const form = useForm<EdoCivilDetailsFormValues>({
    resolver: zodResolver(edoCivilDetailsSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!edoCivilDetail || !open || isDirty) return;
    form.reset(mapEdoCivilDetailToFormValues(edoCivilDetail));
  }, [edoCivilDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      edoCivilDetail
        ? mapEdoCivilDetailToFormValues(edoCivilDetail)
        : DEFAULT_FORM_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !edoCivilDetail));
  const readOnlyMessage =
    "Solo lectura: no puedes actualizar este estado civil porque no tienes permisos.";

  const handleSave = async (values: EdoCivilDetailsFormValues) => {
    if (!edoCivilDetail || !canEdit) return;
    const payload = buildUpdateEdoCivilPayload(values, form.formState.dirtyFields);

    if (Object.keys(payload).length === 0) return;

    try {
      await updateEdoCivil.mutateAsync({ id: edoCivilDetail.id, data: payload });
      toast.success("Estado civil actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset(values);
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getEdoCivilErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const handleStatusChange = async (nextActive: boolean) => {
    if (!edoCivilDetail || !canEdit) return;

    try {
      await updateEdoCivil.mutateAsync({
        id: edoCivilDetail.id,
        data: { isActive: nextActive },
      });
      toast.success(nextActive ? "Estado civil activado" : "Estado civil desactivado");
    } catch (error) {
      toast.error("No se pudo actualizar el estado", {
        description: getEdoCivilErrorMessage(
          error,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const title = edoCivilDetail?.name || edoCivilSummary?.name || "Estado civil";
  const isActive = edoCivilDetail?.isActive ?? edoCivilSummary?.isActive;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = edoCivilDetail
    ? `Creado ${formatDate(edoCivilDetail.createdAt)} por ${edoCivilDetail.createdBy?.name ?? "-"}`
    : null;

  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
      </span>
    </span>
  ) : null;

  const updatedMetaLabel = edoCivilDetail?.updatedAt
    ? `Actualizado ${formatDateTime(edoCivilDetail.updatedAt)} por ${edoCivilDetail.updatedBy?.name ?? "-"}`
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
        No se pudo cargar el estado civil
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getEdoCivilErrorMessage(
          edoCivilDetailError,
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

  const sections: AdminDetailsDialogSection[] = edoCivilDetail
    ? [
        {
          id: "general",
          label: "General",
          content: (
            <>
              <EdoCivilDetailsGeneralSection
                form={form}
                formId={FORM_ID}
                edoCivilDetail={edoCivilDetail}
                onSubmit={handleSave}
                onStatusChange={handleStatusChange}
                isStatusPending={updateEdoCivil.isPending}
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
      titleSrOnly="Detalle de estado civil"
      descriptionSrOnly="Gestiona la configuracion de este estado civil."
      header={
        edoCivilSummary || edoCivilDetail ? (
          <EdoCivilDialogHeader
            title={title}
            status={statusBadge}
            meta={
              edoCivilDetail ? (
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
          isSaving={updateEdoCivil.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
