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
import { useCreateInsumo } from "../mutations/useCatalogosMutations";
import { useCategoriasInsumoList, useUnidadesMedidaList } from "../queries/useCatalogosQueries";
import { getCatalogErrorMessage } from "../utils/catalogos.feedback";

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
});

type FormValues = z.output<typeof schema>;

interface Props {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsumoCreateDialog({ open, onOpenChange }: Props) {
  const createInsumo  = useCreateInsumo();
  const { data: cats }  = useCategoriasInsumoList({ pageSize: 200 });
  const { data: units } = useUnidadesMedidaList({ pageSize: 200 });

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } =
    useForm<z.input<typeof schema>, unknown, FormValues>({ resolver: zodResolver(schema) });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      await createInsumo.mutateAsync(values);
      toast.success("Insumo creado correctamente");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error("No se pudo crear el insumo", {
        description: getCatalogErrorMessage(err, "Verifica los datos e intenta de nuevo"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo insumo</DialogTitle>
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
                id="requiereLote"
                checked={watch("requiereLote") ?? false}
                onCheckedChange={(v) => setValue("requiereLote", v)}
              />
              <Label htmlFor="requiereLote">Requiere lote</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="requiereCaducidad"
                checked={watch("requiereCaducidad") ?? false}
                onCheckedChange={(v) => setValue("requiereCaducidad", v)}
              />
              <Label htmlFor="requiereCaducidad">Requiere caducidad</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createInsumo.isPending}>
              {createInsumo.isPending ? "Guardando..." : "Crear insumo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
