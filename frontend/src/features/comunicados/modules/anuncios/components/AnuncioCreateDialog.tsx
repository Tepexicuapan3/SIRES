import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Switch } from "@shared/ui/switch";
import { Textarea } from "@shared/ui/textarea";
import { ScrollArea } from "@shared/ui/ScrollArea";
import { CatalogDialogHeader } from "@features/admin/modules/catalogos/shared/components/CatalogDialogHeader";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";
import {
  createAnuncioSchema,
  type CreateAnuncioFormInput,
  type CreateAnuncioFormValues,
  type CreateAnuncioResponse,
} from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";
import { useCreateAnuncio } from "@features/comunicados/modules/anuncios/mutations/useCreateAnuncio";
import { ANUNCIO_DEFAULT_VALUES } from "@features/comunicados/modules/anuncios/utils/anuncios.transform";
import { getAnuncioErrorMessage } from "@features/comunicados/modules/anuncios/utils/anuncios.feedback";
import { AnuncioImagePicker } from "@features/comunicados/modules/anuncios/components/AnuncioImagePicker";

interface AnuncioCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORM_ID = "anuncio-create-form";

export function AnuncioCreateDialog({
  open,
  onOpenChange,
}: AnuncioCreateDialogProps) {
  const [createdAnuncio, setCreatedAnuncio] =
    useState<CreateAnuncioResponse | null>(null);
  const createAnuncio = useCreateAnuncio();

  const form = useForm<CreateAnuncioFormInput, unknown, CreateAnuncioFormValues>({
    resolver: zodResolver(createAnuncioSchema),
    defaultValues: ANUNCIO_DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(ANUNCIO_DEFAULT_VALUES);
      setCreatedAnuncio(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateAnuncioFormValues) => {
    try {
      const result = await createAnuncio.mutateAsync({ data: values });

      setCreatedAnuncio(result);
      toast.success("Anuncio creado", {
        description: `El anuncio "${result.anuncio.titulo}" se creó correctamente.`,
      });
      form.reset(ANUNCIO_DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el anuncio", {
        description: getAnuncioErrorMessage(error, "Error al crear anuncio"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-215 xl:w-235">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">Nuevo anuncio</DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo anuncio para el banner del portal de citas.
            </DialogDescription>
            <CatalogDialogHeader
              title="Nuevo anuncio"
              subtitle="Se mostrará en el portal de citas mientras esté vigente"
              status={<Badge variant="outline">Plantilla</Badge>}
              icon={<Bell className="size-7" />}
            />
          </DialogHeader>

          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="space-y-6 pt-4">
              <div className="rounded-2xl border border-line-struct bg-paper p-4">
                <Form {...form}>
                  <form
                    id={FORM_ID}
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ej. Jornada de vacunación"
                            />
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
                            <Textarea rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="imagen"
                        render={({ field, fieldState }) => (
                          <AnuncioImagePicker
                            label="Imagen"
                            hint="JPG, PNG o WEBP · máximo 3 MB"
                            accept="image/jpeg,image/png,image/webp"
                            kind="image"
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adjuntoPdf"
                        render={({ field, fieldState }) => (
                          <AnuncioImagePicker
                            label="Adjunto PDF (opcional)"
                            hint="Máximo 5 MB"
                            accept="application/pdf"
                            kind="file"
                            value={field.value ?? null}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="enlaceUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Enlace (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://..."
                              type="url"
                            />
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
                              <Input type="date" {...field} />
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
                              <Input type="date" {...field} />
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
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>

              {createdAnuncio ? (
                <CatalogCreateResultCard
                  title="Anuncio creado"
                  description="El anuncio ya está disponible y se mostrará en el portal si está vigente."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Título", value: createdAnuncio.anuncio.titulo },
                    { label: "ID", value: createdAnuncio.anuncio.id },
                  ]}
                />
              ) : null}
            </div>
          </ScrollArea>

          <DialogFooter className="flex flex-col gap-3 border-t border-line-struct px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-txt-muted">
              Completa los campos requeridos.
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form={FORM_ID}
                disabled={createAnuncio.isPending}
              >
                Crear anuncio
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
