import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { useAlmacenesList } from "../../catalogos/queries/useCatalogosQueries";
import { useCreateConteo } from "../mutations/useConteosMutations";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";

interface Props {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?:   () => void;
}

export function ConteoCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const createConteo = useCreateConteo();
  const [form, setForm] = useState({
    idAlmacen:    "",
    fchConteo:    new Date().toISOString().split("T")[0],
    observaciones: "",
  });

  const { data: almacenes } = useAlmacenesList({ page: 1, pageSize: 100 });

  const handleClose = () => {
    setForm({ idAlmacen: "", fchConteo: new Date().toISOString().split("T")[0], observaciones: "" });
    onOpenChange(false);
  };

  const f = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.idAlmacen || !form.fchConteo) {
      toast.error("Almacén y fecha son requeridos.");
      return;
    }
    try {
      await createConteo.mutateAsync({
        idAlmacen:    Number(form.idAlmacen),
        fchConteo:    form.fchConteo,
        observaciones: form.observaciones || undefined,
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error("Error al crear conteo", { description: getCatalogErrorMessage(err, "Intenta nuevamente.") });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nuevo conteo físico</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          El sistema precargará las existencias actuales del almacén. Luego podrás ajustar las cantidades físicas antes de cerrar.
        </p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Almacén *</Label>
            <select value={form.idAlmacen} onChange={f("idAlmacen")} className="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">— Selecciona —</option>
              {almacenes?.items.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Fecha del conteo *</Label>
            <Input type="date" value={form.fchConteo} onChange={f("fchConteo")} />
          </div>
          <div className="space-y-1">
            <Label>Observaciones</Label>
            <Input value={form.observaciones} onChange={f("observaciones")} placeholder="Opcional" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={() => { void handleSubmit(); }}
            disabled={createConteo.isPending || !form.idAlmacen}>
            {createConteo.isPending ? "Creando..." : "Iniciar conteo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
