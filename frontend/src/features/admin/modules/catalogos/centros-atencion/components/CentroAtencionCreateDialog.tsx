import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/ScrollArea";
import type { CreateCentroAtencionResponse } from "@api/types";
import { CentroAtencionDialogHeader } from "@features/admin/modules/catalogos/centros-atencion/components/CentroAtencionDialogHeader";
import {
  createCentroAtencionSchema,
  type CreateCentroAtencionFormValues,
} from "@features/admin/modules/catalogos/centros-atencion/domain/centros-atencion.schemas";
import { useCreateCentroAtencion } from "@features/admin/modules/catalogos/centros-atencion/mutations/useCreateCentroAtencion";
import { getCentroAtencionErrorMessage } from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.feedback";
import { buildCreateCentroAtencionPayload } from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.transform";
import { CatalogCreateResultCard } from "@features/admin/modules/catalogos/shared/components/CatalogCreateResultCard";

interface CentroAtencionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CENTER_TYPE = {
  INTERNAL: "internal",
  EXTERNAL: "external",
} as const;

const DEFAULT_VALUES: CreateCentroAtencionFormValues = {
  name: "",
  folioCode: "",
  address: "",
  isExternal: false,
  morningStartsAt: "07:00",
  morningEndsAt: "14:00",
  afternoonStartsAt: "14:00",
  afternoonEndsAt: "20:00",
  nightStartsAt: "20:00",
  nightEndsAt: "23:00",
};

const FORM_ID = "centro-atencion-create-form";

const SCHEDULE_FIELDS = [
  {
    label: "Turno matutino",
    startsAtField: "morningStartsAt",
    endsAtField: "morningEndsAt",
  },
  {
    label: "Turno vespertino",
    startsAtField: "afternoonStartsAt",
    endsAtField: "afternoonEndsAt",
  },
  {
    label: "Turno nocturno",
    startsAtField: "nightStartsAt",
    endsAtField: "nightEndsAt",
  },
] as const;

export function CentroAtencionCreateDialog({
  open,
  onOpenChange,
}: CentroAtencionCreateDialogProps) {
  const [createdCenter, setCreatedCenter] =
    useState<CreateCentroAtencionResponse | null>(null);
  const createCenter = useCreateCentroAtencion();

  const form = useForm<CreateCentroAtencionFormValues>({
    resolver: zodResolver(createCentroAtencionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedCenter(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreateCentroAtencionFormValues) => {
    try {
      const result = await createCenter.mutateAsync({
        data: buildCreateCentroAtencionPayload(values),
      });

      setCreatedCenter(result);
      toast.success("Centro creado", {
        description: `El centro ${result.name} se creo correctamente.`,
      });
      form.reset(DEFAULT_VALUES);
    } catch (error) {
      toast.error("No se pudo crear el centro", {
        description: getCentroAtencionErrorMessage(
          error,
          "Error al crear centro",
        ),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[95vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[92vw] lg:w-235 xl:w-255">
        <div className="flex max-h-[88vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">
              Nuevo centro de atencion
            </DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo centro de atencion para el catalogo administrativo.
            </DialogDescription>
            <CentroAtencionDialogHeader
              title="Nuevo centro"
              subtitle="Configura datos operativos y horarios"
              status={<Badge variant="outline">Plantilla</Badge>}
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del centro</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="folioCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Folio</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.value.toUpperCase(),
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Direccion</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isExternal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select
                              value={
                                field.value
                                  ? CENTER_TYPE.EXTERNAL
                                  : CENTER_TYPE.INTERNAL
                              }
                              onValueChange={(value) =>
                                field.onChange(value === CENTER_TYPE.EXTERNAL)
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={CENTER_TYPE.INTERNAL}>
                                  Interno
                                </SelectItem>
                                <SelectItem value={CENTER_TYPE.EXTERNAL}>
                                  Externo
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-txt-body">
                        Horarios
                      </h4>
                      <div className="grid gap-4">
                        {SCHEDULE_FIELDS.map((scheduleField) => (
                          <div
                            key={scheduleField.label}
                            className="grid gap-3 rounded-xl border border-line-struct/60 bg-subtle/20 p-3 sm:grid-cols-2"
                          >
                            <FormField
                              control={form.control}
                              name={scheduleField.startsAtField}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{`${scheduleField.label} inicia`}</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={scheduleField.endsAtField}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{`${scheduleField.label} termina`}</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </form>
                </Form>
              </div>

              {createdCenter ? (
                <CatalogCreateResultCard
                  title="Centro creado"
                  description="El centro ya esta disponible en el catalogo."
                  badgeLabel="Activo"
                  fields={[
                    { label: "Nombre", value: createdCenter.name },
                    { label: "ID", value: createdCenter.id },
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
                disabled={createCenter.isPending}
              >
                Crear centro
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
