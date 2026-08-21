import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { RadioGroup, RadioGroupItem } from "@shared/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { MenuDestinationSelect } from "@features/admin/modules/menus/components/MenuDestinationSelect";
import { NavIconPicker } from "@features/admin/modules/menus/components/NavIconPicker";
import {
  createModuleFormSchema,
  type CreateModuleFormValues,
} from "@features/admin/modules/menus/domain/menus.schemas";
import { deriveModuleKey } from "@features/admin/modules/menus/domain/deriveModuleKey";
import { flattenModuleFolders } from "@features/admin/modules/menus/domain/flattenModuleFolders";
import { useCreateModule } from "@features/admin/modules/menus/mutations/useCreateModule";
import { useUpdateModule } from "@features/admin/modules/menus/mutations/useUpdateModule";
import { getModuleErrorMessage } from "@features/admin/modules/menus/utils/menus.feedback";
import type {
  CreateModuleRequest,
  ModuleCatalogNodeDTO,
  UpdateModuleRequest,
} from "@api/types";
import type { MenuDestination } from "@/app/navigation/menu-destinations.generated";

/** Sentinel de Radix Select para "raíz (sin carpeta)" -- ver
 * `MoveToFolderDialog`, mismo criterio. */
const ROOT_VALUE = "__root__";

interface ModuleCreateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Arbol COMPLETO -- alimenta el preview de `clave` (colisiones) y el
   * selector de carpeta del paso 3. */
  allNodes: ModuleCatalogNodeDTO[];
  /**
   * Si se pasa, el wizard entra en MODO EDICION sobre este nodo: reusa los
   * pasos 1-2 (tipo+titulo, destino) pero omite el paso 3 (ubicacion) --
   * mover de carpeta es responsabilidad exclusiva de `MoveToFolderDialog`,
   * mismo criterio que separa `UpdateModuleUseCase` de `MoveModuleUseCase`
   * en el backend.
   */
  editingNode?: ModuleCatalogNodeDTO | null;
  /** Carpeta preseleccionada al crear (ej. boton "Agregar aquí" dentro de
   * una carpeta). Ignorado en modo edicion. */
  defaultParentKey?: string | null;
}

const collectAllKeys = (nodes: ModuleCatalogNodeDTO[]): Set<string> => {
  const keys = new Set<string>();
  const visit = (node: ModuleCatalogNodeDTO) => {
    keys.add(node.key);
    for (const child of node.items) visit(child);
  };
  for (const root of nodes) visit(root);
  return keys;
};

const DEFAULT_VALUES: CreateModuleFormValues = {
  kind: "shortcut",
  title: "",
  icon: null,
  url: null,
  permissionCodes: [],
  parentKey: null,
};

const FORM_ID = "module-create-wizard-form";

/**
 * Wizard de 3 pasos para crear un modulo (Tipo+Título+Icono -> Destino ->
 * Ubicación), y doble uso como formulario de edicion (pasando
 * `editingNode`, se acortan a 2 pasos: Tipo+Título+Icono -> Destino). El
 * icono se elige en el paso 1 (via `NavIconPicker`) porque aplica por igual
 * a carpetas y accesos directos -- no depende del destino del paso 2.
 *
 * El permiso del modulo se DERIVA del destino elegido en
 * `MenuDestinationSelect` -- este componente NUNCA muestra ni permite
 * capturar un codigo de permiso crudo en ningun input o label.
 */
export function ModuleCreateWizard({
  open,
  onOpenChange,
  allNodes,
  editingNode = null,
  defaultParentKey = null,
}: ModuleCreateWizardProps) {
  const isEditMode = editingNode !== null;
  const [stepIndex, setStepIndex] = useState(0);
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const isSaving = createModule.isPending || updateModule.isPending;

  const form = useForm<CreateModuleFormValues>({
    resolver: zodResolver(createModuleFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const kind = form.watch("kind");
  const title = form.watch("title");
  const url = form.watch("url");
  const parentKey = form.watch("parentKey");

  const stepSequence = useMemo(() => {
    const sequence: Array<1 | 2 | 3> = [1];
    if (kind === "shortcut") sequence.push(2);
    if (!isEditMode) sequence.push(3);
    return sequence;
  }, [kind, isEditMode]);

  const currentStep = stepSequence[Math.min(stepIndex, stepSequence.length - 1)];
  const isLastStep = stepIndex >= stepSequence.length - 1;

  const existingKeys = useMemo(() => collectAllKeys(allNodes), [allNodes]);
  const folderOptions = useMemo(
    () =>
      flattenModuleFolders(allNodes, {
        excludeSubtreeOf: editingNode?.key ?? null,
      }),
    [allNodes, editingNode],
  );

  const keyPreview = useMemo(
    () =>
      deriveModuleKey({
        title,
        parentKey: isEditMode ? (editingNode?.parentKey ?? null) : parentKey,
        existingKeys,
      }),
    [title, parentKey, existingKeys, isEditMode, editingNode],
  );

  useEffect(() => {
    if (!open) return;

    setStepIndex(0);
    if (editingNode) {
      form.reset({
        kind: editingNode.isSection ? "folder" : "shortcut",
        title: editingNode.title,
        icon: editingNode.icon,
        url: editingNode.url,
        permissionCodes: editingNode.permissions,
        parentKey: editingNode.parentKey,
      });
    } else {
      form.reset({ ...DEFAULT_VALUES, parentKey: defaultParentKey });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset solo cuando cambia `open`/`editingNode`, no en cada tecla
  }, [open, editingNode, defaultParentKey]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const goNext = async () => {
    const fieldsByStep: Record<number, (keyof CreateModuleFormValues)[]> = {
      1: ["kind", "title", "icon"],
      2: ["url", "permissionCodes"],
      3: ["parentKey"],
    };
    const valid = await form.trigger(fieldsByStep[currentStep]);
    if (!valid) return;

    if (isLastStep) {
      await form.handleSubmit(onSubmit)();
      return;
    }
    setStepIndex((index) => Math.min(index + 1, stepSequence.length - 1));
  };

  const goBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleDestinationChange = (destination: MenuDestination) => {
    form.setValue("url", destination.path, { shouldValidate: true });
    form.setValue("permissionCodes", destination.permissions, {
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: CreateModuleFormValues) => {
    try {
      if (isEditMode && editingNode) {
        const payload: UpdateModuleRequest = {
          title: values.title,
          icon: values.icon,
          isSection: values.kind === "folder",
          url: values.kind === "shortcut" ? values.url : null,
          permissionCodes: values.kind === "shortcut" ? values.permissionCodes : [],
        };
        await updateModule.mutateAsync({ clave: editingNode.key, data: payload });
        toast.success("Módulo actualizado", {
          description: `${values.title} se guardó correctamente.`,
        });
      } else {
        const payload: CreateModuleRequest = {
          title: values.title,
          icon: values.icon,
          isSection: values.kind === "folder",
          parentKey: values.parentKey,
          ...(values.kind === "shortcut"
            ? { url: values.url, permissionCodes: values.permissionCodes }
            : {}),
        };
        const result = await createModule.mutateAsync(payload);
        toast.success("Módulo creado", {
          description: `Se creó con la clave "${result.key}".`,
        });
      }
      handleClose();
    } catch (error) {
      toast.error(isEditMode ? "No se pudo guardar" : "No se pudo crear", {
        description: getModuleErrorMessage(
          error,
          isEditMode ? "Error al guardar el módulo" : "Error al crear el módulo",
        ),
      });
    }
  };

  const stepLabel = `Paso ${stepIndex + 1} de ${stepSequence.length}`;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : handleClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar módulo" : "Nuevo módulo"}
          </DialogTitle>
          <DialogDescription>{stepLabel}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={FORM_ID}
            onSubmit={(event) => event.preventDefault()}
            className="space-y-4"
          >
            {currentStep === 1 ? (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de módulo</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-2 gap-3"
                        >
                          <label
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-line-struct/60 px-3 py-2 text-sm has-[[data-state=checked]]:border-brand"
                          >
                            <RadioGroupItem value="shortcut" />
                            Acceso directo
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line-struct/60 px-3 py-2 text-sm has-[[data-state=checked]]:border-brand">
                            <RadioGroupItem value="folder" />
                            Carpeta
                          </label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej. Vacunas" />
                      </FormControl>
                      {title ? (
                        <p className="text-xs text-txt-muted">
                          Clave: <span className="font-mono">{keyPreview}</span>
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icono</FormLabel>
                      <FormControl>
                        <NavIconPicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            {currentStep === 2 ? (
              <FormField
                control={form.control}
                name="url"
                render={() => (
                  <FormItem>
                    <FormLabel>Destino</FormLabel>
                    <FormControl>
                      <MenuDestinationSelect
                        value={url}
                        onChange={handleDestinationChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="parentKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ?? ROOT_VALUE}
                          onValueChange={(value) =>
                            field.onChange(value === ROOT_VALUE ? null : value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona una carpeta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ROOT_VALUE}>
                              — Raíz (sin carpeta) —
                            </SelectItem>
                            {folderOptions.map((option) => (
                              <SelectItem key={option.key} value={option.key}>
                                {"  ".repeat(option.depth)}
                                {option.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="rounded-lg border border-line-struct/60 bg-subtle/20 p-3 text-sm">
                  <p className="font-semibold text-txt-body">Resumen</p>
                  <p className="text-txt-muted">
                    {form.getValues("kind") === "folder" ? "Carpeta" : "Acceso directo"}{" "}
                    «{title}» — clave <span className="font-mono">{keyPreview}</span>
                  </p>
                  {form.getValues("kind") === "shortcut" && url ? (
                    <Badge variant="outline" className="mt-2 text-[10px]">
                      {url}
                    </Badge>
                  ) : null}
                </div>
              </div>
            ) : null}
          </form>
        </Form>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={stepIndex === 0 ? handleClose : goBack}
            disabled={isSaving}
          >
            {stepIndex === 0 ? "Cancelar" : "Atrás"}
          </Button>
          <Button
            type="button"
            onClick={() => void goNext()}
            disabled={isSaving}
          >
            {isLastStep ? (isEditMode ? "Guardar" : "Crear") : "Siguiente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
