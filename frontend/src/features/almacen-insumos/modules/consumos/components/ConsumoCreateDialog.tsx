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
import { CatalogCombobox } from "@shared/ui/catalog-combobox";
import { lotesAPI } from "@api/resources/almacen/kardex.api";
import { medicosAPI } from "@api/resources/medicos.api";
import type { CatInsumo, CreateConsumoDetalleRequest } from "@api/types";
import { useAlmacenesList, useInsumosList } from "../../catalogos/queries/useCatalogosQueries";
import { useCreateConsumo } from "../mutations/useConsumosMutations";
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

interface Row { _key: string; idInsumo: number | null; idLote: string; cantidad: string; }
const emptyRow = (key: string): Row => ({ _key: key, idInsumo: null, idLote: "", cantidad: "" });

export function ConsumoCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const uid           = useId();
  const createConsumo = useCreateConsumo();

  const [form, setForm] = useState({
    idAlmacen:    "",
    paciente:     "",
    medico:       "",
    fchConsumo:   new Date().toISOString().split("T")[0],
    observaciones: "",
  });
  const [rows, setRows] = useState<Row[]>([emptyRow(`${uid}-0`)]);

  const { data: almacenes } = useAlmacenesList({ page: 1, pageSize: 100 });
  const { data: insumos   } = useInsumosList({ page: 1, pageSize: 500 });
  // Médico ahora es FK real (medicos.CatMedico) del lado del backend -- el
  // combobox fuerza una selección real del catálogo en vez del autocomplete
  // de texto libre que había antes (ver MedicoNombreField en el serializer).
  const { data: medicos } = useQuery({
    queryKey: ["medicos-catalogo-consumo"],
    queryFn:  () => medicosAPI.getAll({ estatusMedico: "ACTIVO" }),
    staleTime: 5 * 60 * 1000,
  });
  const medicoOptions = (medicos?.items ?? []).map((m) => ({ id: m.id, name: m.nombreCompleto }));

  const handleClose = () => {
    setForm({ idAlmacen: "", paciente: "", medico: "", fchConsumo: new Date().toISOString().split("T")[0], observaciones: "" });
    setRows([emptyRow(`${uid}-reset`)]);
    onOpenChange(false);
  };

  const f = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const updateRow = (key: string, field: keyof Row, value: string) =>
    setRows((p) => p.map((r) => r._key === key ? { ...r, [field]: value } : r));

  const handleSubmit = async () => {
    if (!form.idAlmacen || !form.fchConsumo) {
      toast.error("Almacén y fecha son requeridos.");
      return;
    }
    const valid = rows.filter((r) => r.idInsumo && r.cantidad);
    if (!valid.length) {
      toast.error("Agrega al menos un insumo con cantidad.");
      return;
    }
    const detalles: CreateConsumoDetalleRequest[] = valid.map((r) => ({
      idInsumo: r.idInsumo!,
      idLote:   r.idLote ? Number(r.idLote) : null,
      cantidad: r.cantidad,
    }));

    try {
      await createConsumo.mutateAsync({
        idAlmacen:     Number(form.idAlmacen),
        paciente:      form.paciente || undefined,
        medico:        form.medico || undefined,
        fchConsumo:    form.fchConsumo,
        observaciones: form.observaciones || undefined,
        detalles,
      });
      toast.success("Consumo registrado");
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error("Error al registrar", { description: getCatalogErrorMessage(err, "Verifica stock disponible.") });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuevo consumo por consulta</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {/* Almacén */}
          <div className="space-y-1">
            <Label>Almacén <span className="text-destructive">*</span></Label>
            <Select
              value={form.idAlmacen}
              onValueChange={(v) => setForm((p) => ({ ...p, idAlmacen: v }))}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="— Selecciona —" />
              </SelectTrigger>
              <SelectContent>
                {almacenes?.items.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha */}
          <div className="space-y-1">
            <Label>Fecha <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.fchConsumo} onChange={f("fchConsumo")} className="h-10" />
          </div>

          {/* Paciente */}
          <div className="space-y-1">
            <Label>Paciente</Label>
            <Input value={form.paciente} onChange={f("paciente")} placeholder="Nombre del paciente" className="h-10" />
          </div>

          {/* Médico — combobox con catálogo (selección forzada) */}
          <div className="space-y-1">
            <Label>Médico</Label>
            <CatalogCombobox
              value={form.medico}
              onChange={(name) => setForm((p) => ({ ...p, medico: name }))}
              options={medicoOptions}
              placeholder="Selecciona un médico..."
              searchPlaceholder="Buscar médico..."
            />
          </div>

          {/* Observaciones */}
          <div className="col-span-2 space-y-1">
            <Label>Observaciones</Label>
            <Textarea
              value={form.observaciones}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
              placeholder="Opcional"
              rows={2}
            />
          </div>
        </div>

        {/* Insumos */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Insumos utilizados</p>
            <Button size="sm" variant="outline" onClick={() => setRows((p) => [...p, emptyRow(`${uid}-${Date.now()}`)])}>
              <Plus className="size-3 mr-1" /> Agregar fila
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left pb-1 pr-2">Insumo <span className="text-destructive">*</span></th>
                <th className="text-left pb-1 pr-2 w-[150px]">Lote</th>
                <th className="text-left pb-1 pr-2 w-[100px]">Cantidad <span className="text-destructive">*</span></th>
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
                    <Input className="h-8 text-xs" type="number" min="1" step="1" value={row.cantidad}
                      onChange={(e) => updateRow(row._key, "cantidad", e.target.value)} placeholder="0" />
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
            disabled={createConsumo.isPending || !form.idAlmacen || !rows.some((r) => r.idInsumo && r.cantidad)}>
            {createConsumo.isPending ? "Guardando..." : "Registrar consumo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
