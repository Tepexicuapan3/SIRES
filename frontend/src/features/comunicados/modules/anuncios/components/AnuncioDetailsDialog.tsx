import { useEffect } from "react";
import { AlertTriangle, Bell, CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { Input } from "@shared/ui/input";
import { Switch } from "@shared/ui/switch";
import { Textarea } from "@shared/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";
import { CatalogDetailsFooter } from "@features/admin/modules/catalogos/shared/components/CatalogDetailsFooter";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import {
  anuncioFormSchema,
  type AnuncioFormInput,
  type AnuncioFormValues,
} from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";
import { useUpdateAnuncio } from "@features/comunicados/modules/anuncios/mutations/useUpdateAnuncio";
import { useAnuncioDetail } from "@features/comunicados/modules/anuncios/queries/useAnuncioDetail";
import { getAnuncioErrorMessage } from "@features/comunicados/modules/anuncios/utils/anuncios.feedback";
import { formatDateTime } from "@features/comunicados/modules/anuncios/utils/anuncios.format";
import {
  mapAnuncioDetailToFormValues,
  buildUpdateAnuncioPayload,
  ANUNCIO_DEFAULT_VALUES,
} from "@features/comunicados/modules/anuncios/utils/anuncios.transform";
import { AnuncioImagePicker } from "@features/comunicados/modules/anuncios/components/AnuncioImagePicker";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { AdminDetailsDialogShell } from "@features/admin/shared/components/details/AdminDetailsDialogShell";
import { useDetailsDialogCloseGuard } from "@features/admin/shared/hooks/useDetailsDialogCloseGuard";
import type { AnuncioListItem } from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";

interface AnuncioDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  anuncioSummary: AnuncioListItem | null;
  canEdit: boolean;
}

const FORM_ID = "anuncio-details-form";

export function AnuncioDetailsDialog({
  open,
  onOpenChange,
  onClose,
  anuncioSummary,
  canEdit,
}: AnuncioDetailsDialogProps) {
  const { isClosing, markClosing, handleOpenChange } =
    useDetailsDialogCloseGuard(onOpenChange);
  const anuncioId = anuncioSummary?.id;
  const {
    data: anuncioDetailResponse,
    isLoading,
    isError,
    error: anuncioDetailError,
    refetch,
  } = useAnuncioDetail(anuncioId, open && Boolean(anuncioId));

  const anuncioDetail = anuncioDetailResponse?.anuncio;
  const updateAnuncio = useUpdateAnuncio();

  const form = useForm<AnuncioFormInput, unknown, AnuncioFormValues>({
    resolver: zodResolver(anuncioFormSchema),
    defaultValues: ANUNCIO_DEFAULT_VALUES,
  });
  const isDirty = form.formState.isDirty;

  useEffect(() => {
    if (!anuncioDetail || !open || isDirty) return;
    form.reset(mapAnuncioDetailToFormValues(anuncioDetail));
  }, [anuncioDetail, form, isDirty, open]);

  const closeDialog = () => {
    markClosing();
    form.reset(
      anuncioDetail
        ? mapAnuncioDetailToFormValues(anuncioDetail)
        : ANUNCIO_DEFAULT_VALUES,
    );
    onClose?.();
    onOpenChange(false);
  };

  const shouldShowLoading = open && isLoading && !isClosing;
  const shouldShowError =
    open && !isClosing && (isError || (!isLoading && !anuncioDetail));

  const handleSave = async (values: AnuncioFormValues) => {
    if (!anuncioDetail || !canEdit) return;
    const payload = buildUpdateAnuncioPayload(
      values,
      form.formState.dirtyFields,
    );

    if (Object.keys(payload).length === 0) return;

    try {
      await updateAnuncio.mutateAsync({ id: anuncioDetail.id, data: payload });
      toast.success("Anuncio actualizado", {
        description: "Los cambios se guardaron correctamente.",
      });
      form.reset({ ...values, imagen: null, adjuntoPdf: null });
    } catch (error) {
      toast.error("No se pudo guardar", {
        description: getAnuncioErrorMessage(error, "Error al guardar cambios"),
      });
    }
  };

  const title = anuncioDetail?.titulo || anuncioSummary?.titulo || "Anuncio";
  const isActive = anuncioDetail?.activo ?? anuncioSummary?.activo;

  const statusBadge =
    typeof isActive === "boolean" ? (
      <CatalogStatusBadge isActive={isActive} />
    ) : null;

  const createdMetaLabel = anuncioDetail
    ? `Creado ${formatDateTime(anuncioDetail.creadoEn)}`
    : null;
  const createdMeta = createdMetaLabel ? (
    <span className="inline-flex max-w-full min-w-0 items-center gap-2">
      <CalendarDays className="size-4 shrink-0" />
      <span className="truncate" title={createdMetaLabel}>
        {createdMetaLabel}
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
        No se pudo cargar el anuncio
      </h3>
      <p className="mt-1 text-sm text-txt-muted">
        {getAnuncioErrorMessage(
          anuncioDetailError,
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

  const detailsContent = anuncioDetail ? (
    <>
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(handleSave)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!canEdit} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} disabled={!canEdit} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="imagen"
              render={({ field, fieldState }) =>
                canEdit ? (
                  <AnuncioImagePicker
                    label="Imagen"
                    hint="JPG, PNG o WEBP · máximo 1 MB · deja vacío para conservar la actual"
                    accept="image/jpeg,image/png,image/webp"
                    kind="image"
                    value={field.value}
                    existingUrl={anuncioDetail.imagenUrl}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-txt-body">
                      Imagen
                    </p>
                    <img
                      src={anuncioDetail.imagenUrl}
                      alt=""
                      className="size-16 rounded-xl object-cover"
                    />
                  </div>
                )
              }
            />
            <FormField
              control={form.control}
              name="adjuntoPdf"
              render={({ field, fieldState }) =>
                canEdit ? (
                  <AnuncioImagePicker
                    label="Adjunto PDF (opcional)"
                    hint="Máximo 5 MB · deja vacío para conservar el actual"
                    accept="application/pdf"
                    kind="file"
                    value={field.value ?? null}
                    existingUrl={anuncioDetail.adjuntoUrl}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-txt-body">
                      Adjunto PDF
                    </p>
                    <p className="text-sm text-txt-muted">
                      {anuncioDetail.adjuntoUrl ? "Disponible" : "Sin adjunto"}
                    </p>
                  </div>
                )
              }
            />
          </div>

          <FormField
            control={form.control}
            name="enlaceUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enlace (opcional)</FormLabel>
                <FormControl>
                  <Input {...field} type="url" disabled={!canEdit} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="vigenciaDesde"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vigencia desde</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vigenciaHasta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vigencia hasta (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orden"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      disabled={!canEdit}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? 0
                            : Number(event.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="activo"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border border-line-struct p-3">
                <FormLabel className="mb-0">Activo</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!canEdit}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>

      {!canEdit ? (
        <AdminReadOnlyNotice message="Solo lectura: no puedes actualizar este anuncio porque no tienes permisos." />
      ) : null}
    </>
  ) : null;

  return (
    <AdminDetailsDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      onRequestClose={closeDialog}
      titleSrOnly="Detalle de anuncio"
      descriptionSrOnly="Gestiona la configuración de este anuncio."
      header={
        anuncioSummary || anuncioDetail ? (
          <CatalogDialogHeader
            title={title}
            status={statusBadge}
            meta={createdMeta}
            icon={<Bell className="size-7" />}
          />
        ) : null
      }
      topContent={<Separator />}
      isDirty={isDirty}
      isLoading={shouldShowLoading}
      isError={shouldShowError}
      loadingContent={loadingContent}
      errorContent={errorContent}
      content={detailsContent}
      dialogContentClassName="h-auto max-h-[90vh] w-[86vw] max-w-none rounded-3xl bg-paper p-0 sm:max-w-[880px]"
      footer={({ onCancel }) => (
        <CatalogDetailsFooter
          isDirty={isDirty}
          isSaving={updateAnuncio.isPending}
          formId={FORM_ID}
          onCancel={onCancel}
          disableSave={!canEdit}
        />
      )}
    />
  );
}
