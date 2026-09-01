import { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { Textarea } from "@shared/ui/textarea";
import { useUpdateInsumo } from "../mutations/useCatalogosMutations";
import { useCategoriasInsumoList, useUnidadesMedidaList } from "../queries/useCatalogosQueries";
import { getCatalogErrorMessage } from "../utils/catalogos.feedback";
import type { CatInsumo } from "@api/types";

const schema = z.object({
  nombre:            z.string().min(1, "Requerido"),
  codigo:            z.string().min(1, "Requerido"),
  codigoBarras:      z.string().optional(),
  descripcion:       z.string().optional(),
  idCategoria:       z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(1, "Selecciona una categoría")),
  idUnidad:          z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().min(1, "Selecciona una unidad")),
  stockMinimo:       z.string().optional(),
  requiereLote:      z.boolean().optional(),
  requiereCaducidad: z.boolean().optional(),
  isActive:          z.boolean(),
});

type FormValues = z.output<typeof schema>;

interface Props {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  item:         CatInsumo | null;
}

export function InsumoEditDialog({ open, onOpenChange, item }: Props) {
  const updateInsumo   = useUpdateInsumo();
  const { data: cats }  = useCategoriasInsumoList({ pageSize: 200 });
  const { data: units } = useUnidadesMedidaList({ pageSize: 200 });

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } =
    useForm<z.input<typeof schema>, unknown, FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open && item) {
      reset({
        nombre:            item.nombre,
        codigo:            item.codigo,
        codigoBarras:      item.codigoBarras ?? "",
        descripcion:       item.descripcion ?? "",
        idCategoria:       item.idCategoria,
        idUnidad:          item.idUnidad,
        stockMinimo:       item.stockMinimo ?? "",
        requiereLote:      item.requiereLote,
        requiereCaducidad: item.requiereCaducidad,
        isActive:          item.isActive,
      });
    }
  }, [open, item, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!item) return;
    try {
      await updateInsumo.mutateAsync({ id: item.id, data: values });
      toast.success("Insumo actualizado correctamente");
      onOpenChange(false);
    } catch (err) {
      toast.error("No se pudo actualizar el insumo", {
        description: getCatalogErrorMessage(err, "Verifica los datos e intenta de nuevo"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar insumo</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Nombre *</Label>
              <Input {...register("nombre")} placeholder="Nombre del insumo" />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Código *</Label>
              <Input {...register("codigo")} placeholder="Ej: INS-001" />
              {errors.codigo && <p className="text-xs text-destructive">{errors.codigo.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Código de barras</Label>
              <Input {...register("codigoBarras")} placeholder="Escanea o escribe" />
            </div>

            <div className="space-y-1">
              <Label>Categoría *</Label>
              <Controller
                control={control}
                name="idCategoria"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cats?.items.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.idCategoria && <p className="text-xs text-destructive">{errors.idCategoria.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Unidad de medida *</Label>
              <Controller
                control={control}
                name="idUnidad"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : ""} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.items.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.nombre} ({u.abreviacion})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.idUnidad && <p className="text-xs text-destructive">{errors.idUnidad.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Stock mínimo</Label>
              <Input {...register("stockMinimo")} type="number" min="0" step="1" placeholder="0" />
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Descripción</Label>
              <Textarea {...register("descripcion")} placeholder="Opcional" rows={3} />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="requiereLoteEdit"
                checked={watch("requiereLote") ?? false}
                onCheckedChange={(v) => setValue("requiereLote", v)}
              />
              <Label htmlFor="requiereLoteEdit">Requiere lote</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="requiereCaducidadEdit"
                checked={watch("requiereCaducidad") ?? false}
                onCheckedChange={(v) => setValue("requiereCaducidad", v)}
              />
              <Label htmlFor="requiereCaducidadEdit">Requiere caducidad</Label>
            </div>

            <div className="col-span-2 flex items-center justify-between rounded-lg border px-3 py-2">
              <Label htmlFor="isActiveEdit" className="cursor-pointer">Estado</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{watch("isActive") ? "Activo" : "Inactivo"}</span>
                <Switch
                  id="isActiveEdit"
                  checked={watch("isActive") ?? true}
                  onCheckedChange={(v) => setValue("isActive", v)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateInsumo.isPending}>
              {updateInsumo.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
