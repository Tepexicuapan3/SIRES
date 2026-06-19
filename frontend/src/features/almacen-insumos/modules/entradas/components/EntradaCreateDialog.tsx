import { useState, useId } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ScanLine, X, PackagePlus } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { BarcodeScannerInput } from "@shared/ui/BarcodeScannerInput";
import type { CatInsumo, CreateEntradaDetalleRequest } from "@api/types";
import { useAlmacenesList, useProveedoresList, useInsumosList } from "../../catalogos/queries/useCatalogosQueries";
import { useCreateEntrada } from "../mutations/useEntradasMutations";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";

interface Props {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?:   () => void;
}

interface DetalleRow {
  _key:           string;
  idInsumo:       number | null;
  insumoNombre:   string;
  numLote:        string;
  fechaCaducidad: string;
  cantidad:       string;
  costoUnitario:  string;
}

const emptyRow = (key: string): DetalleRow => ({
  _key: key, idInsumo: null, insumoNombre: "",
  numLote: "", fechaCaducidad: "", cantidad: "", costoUnitario: "",
});

const initialForm = () => ({
  idAlmacen:     "",
  idProveedor:   "",
  numRemision:   "",
  fchEntrada:    new Date().toISOString().split("T")[0],
  observaciones: "",
});

const selectCls =
  "w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-foreground " +
  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent h-10";

export function EntradaCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const uid = useId();
  const createEntrada = useCreateEntrada();

  const [form, setForm] = useState(initialForm);
  const [rows, setRows] = useState<DetalleRow[]>([emptyRow(`${uid}-0`)]);

  const { data: almacenes   } = useAlmacenesList({ page: 1, pageSize: 100 });
  const { data: proveedores } = useProveedoresList({ page: 1, pageSize: 100 });
  const { data: insumos     } = useInsumosList({ page: 1, pageSize: 500 });

  const handleClose = () => {
    setForm(initialForm());
    setRows([emptyRow(`${uid}-reset`)]);
    onOpenChange(false);
  };

  const handleScan = (rowKey: string, barcode: string) => {
    const insumo = insumos?.items.find(
      (i: CatInsumo) => i.codigoBarras === barcode || i.codigo === barcode,
    );
    if (!insumo) {
      toast.error("Insumo no encontrado", { description: `Código: ${barcode}` });
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r._key === rowKey ? { ...r, idInsumo: insumo.id, insumoNombre: insumo.nombre } : r,
      ),
    );
  };

  const clearInsumo = (key: string) =>
    setRows((prev) =>
      prev.map((r) => r._key === key ? { ...r, idInsumo: null, insumoNombre: "" } : r),
    );

  const addRow = () =>
    setRows((prev) => [...prev, emptyRow(`${uid}-${Date.now()}`)]);

  const removeRow = (key: string) =>
    setRows((prev) => prev.filter((r) => r._key !== key));

  const updateRow = (key: string, field: keyof DetalleRow, value: string) =>
    setRows((prev) => prev.map((r) => r._key === key ? { ...r, [field]: value } : r));

  const handleSubmit = async () => {
    if (!form.idAlmacen || !form.fchEntrada) {
      toast.error("Almacén y fecha de entrada son requeridos.");
      return;
    }
    const validRows = rows.filter((r) => r.idInsumo && r.cantidad);
    if (!validRows.length) {
      toast.error("Agrega al menos un insumo con cantidad.");
      return;
    }
    const detalles: CreateEntradaDetalleRequest[] = validRows.map((r) => ({
      idInsumo:      r.idInsumo!,
      loteDatos:     r.numLote
        ? { numLote: r.numLote, fechaCaducidad: r.fechaCaducidad || null }
        : undefined,
      cantidad:      r.cantidad,
      costoUnitario: r.costoUnitario || null,
    }));
    try {
      await createEntrada.mutateAsync({
        idAlmacen:     Number(form.idAlmacen),
        idProveedor:   form.idProveedor ? Number(form.idProveedor) : null,
        numRemision:   form.numRemision,
        fchEntrada:    form.fchEntrada,
        observaciones: form.observaciones,
        detalles,
      });
      toast.success("Entrada registrada", { description: `${validRows.length} insumo(s) registrado(s).` });
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error("Error al registrar entrada", {
        description: getCatalogErrorMessage(err, "Verifica los datos e intenta nuevamente."),
      });
    }
  };

  const f = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validRowCount = rows.filter((r) => r.idInsumo && r.cantidad).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[99vw] max-w-none h-[97vh] flex flex-col gap-0 p-0 overflow-hidden rounded-lg">

        {/* ── Header ─────────────────────────────────────────── */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <PackagePlus className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Nueva entrada de inventario
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Completá los datos del documento y los insumos recibidos.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* ── Cuerpo único scrolleable ───────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* ─ Datos del documento ─────────────────────────── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Datos del documento
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">

              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">
                  Almacén <span className="text-destructive">*</span>
                </Label>
                <select value={form.idAlmacen} onChange={f("idAlmacen")} className={selectCls}>
                  <option value="">Selecciona…</option>
                  {almacenes?.items.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">Proveedor</Label>
                <select value={form.idProveedor} onChange={f("idProveedor")} className={selectCls}>
                  <option value="">Sin proveedor</option>
                  {proveedores?.items.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Núm. remisión</Label>
                <Input
                  value={form.numRemision}
                  onChange={f("numRemision")}
                  placeholder="REM-0001"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Fecha de entrada <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.fchEntrada}
                  onChange={f("fchEntrada")}
                  className="h-10"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">Observaciones</Label>
                <Input
                  value={form.observaciones}
                  onChange={f("observaciones")}
                  placeholder="Notas adicionales…"
                  className="h-10"
                />
              </div>

            </div>
          </section>

          {/* ─ Insumos recibidos ───────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Insumos recibidos
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {validRowCount > 0
                    ? `${validRowCount} insumo(s) listos para guardar`
                    : "Completá al menos un insumo con cantidad"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={addRow} className="gap-1.5">
                <Plus className="size-3.5" />
                Agregar insumo
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {rows.map((row, idx) => {
                const completa = Boolean(row.idInsumo && row.cantidad);
                return (
                  <div
                    key={row._key}
                    className={`rounded-lg border p-5 space-y-3 transition-colors ${
                      completa
                        ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeRow(row._key)}
                        disabled={rows.length === 1}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">Código / escaneo</Label>
                      <BarcodeScannerInput
                        placeholder="Escanea o escribí el código"
                        onScan={(code) => handleScan(row._key, code)}
                        className="h-10 text-sm w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">
                        Insumo <span className="text-destructive">*</span>
                      </Label>
                      {row.insumoNombre ? (
                        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5">
                          <span className="flex-1 text-sm font-medium text-foreground leading-snug break-words">
                            {row.insumoNombre}
                          </span>
                          <button
                            type="button"
                            onClick={() => clearInsumo(row._key)}
                            className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Cambiar insumo"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <select
                          className={selectCls}
                          value={row.idInsumo ?? ""}
                          onChange={(e) => {
                            const ins = insumos?.items.find(
                              (i: CatInsumo) => i.id === Number(e.target.value),
                            );
                            updateRow(row._key, "idInsumo", e.target.value);
                            if (ins) updateRow(row._key, "insumoNombre", ins.nombre);
                          }}
                        >
                          <option value="">Selecciona un insumo…</option>
                          {insumos?.items.map((i: CatInsumo) => (
                            <option key={i.id} value={i.id}>{i.nombre}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">Lote</Label>
                      <Input
                        className="h-10 text-sm"
                        value={row.numLote}
                        onChange={(e) => updateRow(row._key, "numLote", e.target.value)}
                        placeholder="Número de lote"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">Caducidad</Label>
                        <Input
                          type="date"
                          className="h-10 text-sm"
                          value={row.fechaCaducidad}
                          onChange={(e) => updateRow(row._key, "fechaCaducidad", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">
                          Cantidad <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          className="h-10 text-sm"
                          value={row.cantidad}
                          onChange={(e) => updateRow(row._key, "cantidad", e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">Costo unitario</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-10 text-sm"
                        value={row.costoUnitario}
                        onChange={(e) => updateRow(row._key, "costoUnitario", e.target.value)}
                        placeholder="$0.00"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
              <ScanLine className="size-3.5 shrink-0" />
              <span>
                El lector USB captura automáticamente al escanear.
                Hacé clic en <strong>✕</strong> para cambiar el insumo asignado.
              </span>
            </div>
          </section>

        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Los campos con <span className="text-destructive font-medium">*</span> son obligatorios.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button
              onClick={() => { void handleSubmit(); }}
              disabled={
                createEntrada.isPending ||
                !form.idAlmacen ||
                !rows.some((r) => r.idInsumo && r.cantidad)
              }
            >
              {createEntrada.isPending
                ? "Guardando..."
                : `Registrar entrada${validRowCount > 0 ? ` (${validRowCount})` : ""}`}
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
