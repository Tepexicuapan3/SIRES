import { useState, useId, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, X } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
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
    <select
      className="h-8 text-xs w-full border rounded-md px-2 py-1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={!idInsumo}
    >
      <option value="">— Lote —</option>
      {data?.items.map((l) => (
        <option key={l.id} value={l.id}>{l.numLote}</option>
      ))}
    </select>
  );
}

interface Props {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?:   () => void;
}

interface Row { _key: string; idInsumo: number | null; idLote: string; cantidad: string; }
const emptyRow = (key: string): Row => ({ _key: key, idInsumo: null, idLote: "", cantidad: "" });

const selectCls = "w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring h-10";

export function ConsumoCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const uid           = useId();
  const createConsumo = useCreateConsumo();
  const medicoRef     = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    idAlmacen:    "",
    paciente:     "",
    medico:       "",
    fchConsumo:   new Date().toISOString().split("T")[0],
    observaciones: "",
  });
  const [rows, setRows]           = useState<Row[]>([emptyRow(`${uid}-0`)]);
  const [medicoQuery, setMedicoQuery] = useState("");
  const [medicoOpen, setMedicoOpen]   = useState(false);

  const { data: almacenes } = useAlmacenesList({ page: 1, pageSize: 100 });
  const { data: insumos   } = useInsumosList({ page: 1, pageSize: 500 });
  const { data: medicos   } = useQuery({
    queryKey: ["medicos-catalogo-consumo"],
    queryFn:  () => medicosAPI.getAll({ estatusMedico: "ACTIVO" }),
    staleTime: 5 * 60 * 1000,
  });

  const medicosFiltrados = (medicos?.items ?? []).filter((m) =>
    m.nombreCompleto.toLowerCase().includes(medicoQuery.toLowerCase())
  );

  const seleccionarMedico = (nombre: string) => {
    setForm((p) => ({ ...p, medico: nombre }));
    setMedicoQuery(nombre);
    setMedicoOpen(false);
  };

  const limpiarMedico = () => {
    setForm((p) => ({ ...p, medico: "" }));
    setMedicoQuery("");
    setMedicoOpen(false);
  };

  const handleClose = () => {
    setForm({ idAlmacen: "", paciente: "", medico: "", fchConsumo: new Date().toISOString().split("T")[0], observaciones: "" });
    setRows([emptyRow(`${uid}-reset`)]);
    setMedicoQuery("");
    setMedicoOpen(false);
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
            <select value={form.idAlmacen} onChange={f("idAlmacen")} className={selectCls}>
              <option value="">— Selecciona —</option>
              {almacenes?.items.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
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

          {/* Médico — combobox con catálogo */}
          <div className="space-y-1">
            <Label>Médico</Label>
            <div ref={medicoRef} className="relative">
              <div className="relative flex items-center">
                <Input
                  value={medicoQuery}
                  onChange={(e) => {
                    setMedicoQuery(e.target.value);
                    setForm((p) => ({ ...p, medico: e.target.value }));
                    setMedicoOpen(true);
                  }}
                  onFocus={() => setMedicoOpen(true)}
                  onBlur={() => setTimeout(() => setMedicoOpen(false), 150)}
                  placeholder="Buscar o escribir médico…"
                  className="h-10 pr-16"
                  autoComplete="off"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {medicoQuery && (
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); limpiarMedico(); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Limpiar"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </div>
              </div>

              {medicoOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
                  {medicosFiltrados.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      {medicoQuery.length > 0 ? "Sin coincidencias" : "Escribe para filtrar"}
                    </p>
                  ) : (
                    <ul className="max-h-48 overflow-y-auto">
                      {medicosFiltrados.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); seleccionarMedico(m.nombreCompleto); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                              form.medico === m.nombreCompleto ? "bg-accent font-medium" : ""
                            }`}
                          >
                            <span className="block font-medium">{m.nombreCompleto}</span>
                            {m.especialidades[0] && (
                              <span className="block text-xs text-muted-foreground">{m.especialidades[0].name}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
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
                    <select className="w-full border rounded-md px-2 py-1 text-xs"
                      value={row.idInsumo ?? ""}
                      onChange={(e) => updateRow(row._key, "idInsumo", e.target.value)}>
                      <option value="">— Insumo —</option>
                      {insumos?.items.map((i: CatInsumo) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                    </select>
                  </td>
                  <td className="py-1 pr-2">
                    <LoteSelect idInsumo={row.idInsumo} value={row.idLote} onChange={(v) => updateRow(row._key, "idLote", v)} />
                  </td>
                  <td className="py-1 pr-2">
                    <Input className="h-8 text-xs" type="number" min="1" step="1" value={row.cantidad}
                      onChange={(e) => updateRow(row._key, "cantidad", e.target.value)} placeholder="0" />
                  </td>
                  <td className="py-1">
                    <Button size="icon" variant="ghost" className="size-7 text-destructive"
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
