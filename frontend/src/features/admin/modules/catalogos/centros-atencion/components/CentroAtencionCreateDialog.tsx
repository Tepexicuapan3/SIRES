import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ScrollArea } from "@shared/ui/ScrollArea";
import { Separator } from "@shared/ui/separator";
import type {
  CreateCentroAtencionResponse,
  PostalCodeSearchItem,
} from "@api/types";
import { centrosAtencionAPI } from "@api/resources/catalogos/centros-atencion.api";
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

const CENTER_ORIGIN = {
  INTERNAL: "internal",
  EXTERNAL: "external",
} as const;

const CENTER_TYPE = {
  CLINICA: "CLINICA",
  HOSPITAL: "HOSPITAL",
} as const;

const DEFAULT_VALUES: CreateCentroAtencionFormValues = {
  name: "",
  code: "",
  centerType: "CLINICA",
  legacyFolio: null,
  isExternal: false,
  address: null,
  postalCode: null,
  neighborhood: null,
  municipality: null,
  state: null,
  city: null,
  phone: null,
  isActive: true,
};

const FORM_ID = "centro-atencion-create-form";
const CP_DEBOUNCE_MS = 600;

export function CentroAtencionCreateDialog({
  open,
  onOpenChange,
}: CentroAtencionCreateDialogProps) {
  const [createdCenter, setCreatedCenter] =
    useState<CreateCentroAtencionResponse | null>(null);
  const [postalCodeOptions, setPostalCodeOptions] = useState<
    PostalCodeSearchItem[]
  >([]);
  const [isSearchingPostalCode, setIsSearchingPostalCode] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createCenter = useCreateCentroAtencion();

  const form = useForm<CreateCentroAtencionFormValues>({
    resolver: zodResolver(createCentroAtencionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const postalCodeValue = form.watch("postalCode");

  // Auto-búsqueda cuando el CP tiene exactamente 5 dígitos
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const cp = postalCodeValue?.trim() ?? "";

    if (cp.length !== 5) {
      setPostalCodeOptions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSearchingPostalCode(true);
        const response = await centrosAtencionAPI.searchPostalCode(cp);
        setPostalCodeOptions(response.items);

        if (response.items.length === 0) {
          toast.warning("Sin resultados", {
            description: "No se encontraron colonias para ese codigo postal.",
          });
        }
      } catch (error) {
        toast.error("No se pudo buscar el codigo postal", {
          description: getCentroAtencionErrorMessage(
            error,
            "Error al consultar codigo postal",
          ),
        });
      } finally {
        setIsSearchingPostalCode(false);
      }
    }, CP_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [postalCodeValue]);

  const selectedPostalCodeOption = useMemo(() => {
    const neighborhood = form.getValues("neighborhood");
    if (!neighborhood) return null;
    return postalCodeOptions.find((item) => item.colonia === neighborhood) ?? null;
  }, [postalCodeOptions, form]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
      setCreatedCenter(null);
      setPostalCodeOptions([]);
    }
    onOpenChange(nextOpen);
  };

  const handleSelectPostalCodeOption = (value: string) => {
    const selected = postalCodeOptions.find((item) => item.colonia === value);
    if (!selected) return;

    form.setValue("neighborhood", selected.colonia, { shouldDirty: true });
    form.setValue("municipality", selected.municipio, { shouldDirty: true });
    form.setValue("state", selected.estado, { shouldDirty: true });
    form.setValue("city", selected.ciudad || null, { shouldDirty: true });
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
      setPostalCodeOptions([]);
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
      <DialogContent className="w-[96vw] max-w-none rounded-3xl bg-paper p-0 sm:w-[90vw] sm:max-w-[860px] lg:max-w-[1020px]">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle className="sr-only">
              Nuevo centro de atencion
            </DialogTitle>
            <DialogDescription className="sr-only">
              Crea un nuevo centro de atencion para el catalogo administrativo.
            </DialogDescription>
            <CentroAtencionDialogHeader
              title="Nuevo centro"
              subtitle="Configura datos generales y direccion"
              status={<Badge variant="outline">Plantilla</Badge>}
            />
          </DialogHeader>

          <ScrollArea className="flex-1 px-8 pb-8">
            <div className="space-y-6 pt-4">
              <div className="rounded-2xl border border-line-struct bg-paper p-5">
                <Form {...form}>
                  <form
                    id={FORM_ID}
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* ── Datos generales ── */}
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-txt-body">
                        Datos generales
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_160px_160px]">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="lg:col-span-2">
                              <FormLabel>Nombre del centro</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CLUES</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="centerType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tipo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={CENTER_TYPE.CLINICA}>
                                    Clinica
                                  </SelectItem>
                                  <SelectItem value={CENTER_TYPE.HOSPITAL}>
                                    Hospital
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="isExternal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Origen</FormLabel>
                              <Select
                                value={
                                  field.value
                                    ? CENTER_ORIGIN.EXTERNAL
                                    : CENTER_ORIGIN.INTERNAL
                                }
                                onValueChange={(v) =>
                                  field.onChange(v === CENTER_ORIGIN.EXTERNAL)
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={CENTER_ORIGIN.INTERNAL}>
                                    Interno
                                  </SelectItem>
                                  <SelectItem value={CENTER_ORIGIN.EXTERNAL}>
                                    Externo
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="legacyFolio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Folio legacy</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefono</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* ── Dirección ── */}
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-txt-body">
                        Direccion
                      </h4>

                      {/* CP + colonia sugerida */}
                      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Codigo postal</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    maxLength={5}
                                    inputMode="numeric"
                                    className="pr-8"
                                  />
                                  {isSearchingPostalCode ? (
                                    <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-txt-muted" />
                                  ) : null}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormItem>
                          <FormLabel>Colonia sugerida</FormLabel>
                          <Select
                            value={form.watch("neighborhood") ?? ""}
                            onValueChange={handleSelectPostalCodeOption}
                            disabled={postalCodeOptions.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isSearchingPostalCode
                                      ? "Buscando colonias..."
                                      : postalCodeOptions.length === 0
                                        ? "Captura el CP primero"
                                        : "Selecciona colonia"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {postalCodeOptions.map((item) => (
                                <SelectItem
                                  key={`${item.codigoPostal}-${item.colonia}`}
                                  value={item.colonia}
                                >
                                  {item.colonia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      </div>

                      {/* Info asentamiento */}
                      {selectedPostalCodeOption ? (
                        <div className="mt-3 flex gap-4 rounded-xl border border-line-struct/60 bg-subtle/20 px-4 py-2.5 text-sm text-txt-muted">
                          <span>
                            <span className="font-medium text-txt-body">
                              Tipo:{" "}
                            </span>
                            {selectedPostalCodeOption.tipoAsentamiento}
                          </span>
                          <span>
                            <span className="font-medium text-txt-body">
                              Zona:{" "}
                            </span>
                            {selectedPostalCodeOption.zona}
                          </span>
                        </div>
                      ) : null}

                      {/* Dirección + desglose */}
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr]">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="lg:col-span-2">
                              <FormLabel>Direccion</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="neighborhood"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Colonia</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="municipality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Municipio / Alcaldia</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ciudad</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
