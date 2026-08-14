import { useState, useId } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { lotesAPI } from "@api/resources/almacen/kardex.api";
import type { CatInsumo, CreateSalidaDetalleRequest } from "@api/types";
import { TIPO_SALIDA, TIPO_SALIDA_LABELS } from "@api/types";
import { useAlmacenesList, useInsumosList } from "../../catalogos/queries/useCatalogosQueries";
import { useCreateSalida } from "../mutations/useSalidasMutations";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";

function LoteSelect({ idInsumo, value, onChange }: { idInsumo: number | null; value: string; onChange: (v: string) => void }) {
  const { data } = useQuery({
    queryKey: ["lotes-by-insumo", idInsumo],
    queryFn: () => lotesAPI.list({ idInsumo: idInsumo!, pageSize: 200 }),
    enabled: idInsumo != null,
  });
  return (
    <Select
      value={value || "none"}
      onValueChange={(v) => onChange(v === "none" ? "" : v)}
      disabled={!idInsumo}
    >
      <SelectTrigger className="h-8 w-full text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— Lote —</SelectItem>
        {data?.items.map((l) => (
          <SelectItem key={l.id} value={String(l.id)}>{l.numLote}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface Props {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?:   () => void;
}

interface Row {
  _key:      string;
  idInsumo:  number | null;
  idLote:    string;
  cantidad:  string;
}

const emptyRow = (key: string): Row => ({ _key: key, idInsumo: null, idLote: "", cantidad: "" });

export function SalidaCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const uid          = useId();
  const createSalida = useCreateSalida();

  const [form, setForm] = useState({
    idAlmacen:  "",
    tipoSalida: TIPO_SALIDA.SALIDA as (typeof TIPO_SALIDA)[keyof typeof TIPO_SALIDA],
    numFolio:   "",
    fchSalida:  new Date().toISOString().split("T")[0],
    motivo:     "",
  });
  const [rows, setRows] = useState<Row[]>([emptyRow(`${uid}-0`)]);

  const { data: almacenes } = useAlmacenesList({ page: 1, pageSize: 100 });
  const { data: insumos   } = useInsumosList({ page: 1, pageSize: 500 });

  const handleClose = () => {
    setForm({ idAlmacen: "", tipoSalida: TIPO_SALIDA.SALIDA, numFolio: "", fchSalida: new Date().toISOString().split("T")[0], motivo: "" });
    setRows([emptyRow(`${uid}-reset`)]);
    onOpenChange(false);
  };

  const f = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const updateRow = (key: string, field: keyof Row, value: string) =>
    setRows((p) => p.map((r) => r._key === key ? { ...r, [field]: value } : r));

  const handleSubmit = async () => {
    if (!form.idAlmacen || !form.fchSalida) {
      toast.error("Almacén y fecha son requeridos.");
      return;
    }
    const valid = rows.filter((r) => r.idInsumo && r.cantidad);
    if (!valid.length) {
      toast.error("Agrega al menos un insumo con cantidad.");
      return;
    }
    const detalles: CreateSalidaDetalleRequest[] = valid.map((r) => ({
      idInsumo: r.idInsumo!,
      idLote:   r.idLote ? Number(r.idLote) : null,
      cantidad: r.cantidad,
    }));

    try {
      await createSalida.mutateAsync({
        idAlmacen:  Number(form.idAlmacen),
        tipoSalida: form.tipoSalida as (typeof TIPO_SALIDA)[keyof typeof TIPO_SALIDA],
        numFolio:   form.numFolio || undefined,
        fchSalida:  form.fchSalida,
        motivo:     form.motivo || undefined,
        detalles,
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error("Error al registrar", { description: getCatalogErrorMessage(err, "Verifica stock disponible.") });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nueva salida de inventario</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Almacén *</Label>
            <Select value={form.idAlmacen} onValueChange={(v) => setForm((p) => ({ ...p, idAlmacen: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="— Selecciona —" />
              </SelectTrigger>
              <SelectContent>
                {almacenes?.items.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select
              value={form.tipoSalida}
              onValueChange={(v) => setForm((p) => ({ ...p, tipoSalida: v as (typeof TIPO_SALIDA)[keyof typeof TIPO_SALIDA] }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_SALIDA_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Núm. folio</Label>
            <Input value={form.numFolio} onChange={f("numFolio")} placeholder="SAL-0001" />
          </div>
          <div className="space-y-1">
            <Label>Fecha *</Label>
            <Input type="date" value={form.fchSalida} onChange={f("fchSalida")} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Motivo</Label>
            <Textarea value={form.motivo} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, motivo: e.target.value }))} placeholder="Motivo de la salida (opcional)" rows={2} />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Insumos</p>
            <Button size="sm" variant="outline" onClick={() => setRows((p) => [...p, emptyRow(`${uid}-${Date.now()}`)])}>
              <Plus className="size-3 mr-1" /> Agregar fila
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left pb-1 pr-2">Insumo *</th>
                <th className="text-left pb-1 pr-2 w-[150px]">Lote</th>
                <th className="text-left pb-1 pr-2 w-[100px]">Cantidad *</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._key} className="border-b last:border-0">
                  <td className="py-1 pr-2">
                    <Select
                      value={row.idInsumo !== null ? String(row.idInsumo) : ""}
                      onValueChange={(v) => updateRow(row._key, "idInsumo", v)}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue placeholder="— Insumo —" />
                      </SelectTrigger>
                      <SelectContent>
                        {insumos?.items.map((i: CatInsumo) => (
                          <SelectItem key={i.id} value={String(i.id)}>{i.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-1 pr-2">
                    <LoteSelect idInsumo={row.idInsumo} value={row.idLote} onChange={(v) => updateRow(row._key, "idLote", v)} />
                  </td>
                  <td className="py-1 pr-2">
                    <Input className="h-8 text-xs" type="number" min="1" step="1" value={row.cantidad} onChange={(e) => updateRow(row._key, "cantidad", e.target.value)} placeholder="0" />
                  </td>
                  <td className="py-1">
                    <Button size="icon" variant="ghost" className="size-7 text-destructive" aria-label="Eliminar fila"
                      onClick={() => setRows((p) => p.filter((r) => r._key !== row._key))} disabled={rows.length === 1}>
                      <Trash2 className="size-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={() => { void handleSubmit(); }}
            disabled={createSalida.isPending || !form.idAlmacen || !rows.some((r) => r.idInsumo && r.cantidad)}>
            {createSalida.isPending ? "Guardando..." : "Registrar salida"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
