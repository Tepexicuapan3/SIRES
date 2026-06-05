import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input }  from "@shared/ui/input";
import { Label }  from "@shared/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@shared/ui/dialog";
import {
  CONTRATO_STATUS_LABELS, TP_DER_LABELS,
  type ContratoOxigeno, type ContratoStatus, type TpDer,
} from "@api/types";

// ── Constantes ────────────────────────────────────────────────────────────────

const SUCURSALES = ["MATRIZ", "NORTE", "SUR", "ORIENTE", "PONIENTE", "OTRA"];
const SERVICIOS  = ["CONCENTRADOR", "CPAP", "BIPAP", "NEBULIZADOR", "OTRO EQUIPO"];

// ── Tipos del formulario ──────────────────────────────────────────────────────

interface FormData {
  sucursal:      string;
  numContrato:   string;
  nombre:        string;
  expediente:    string;
  tpDer:         TpDer;
  clinica:       string;
  servicio:      string;
  fechaSoporte:  string;
  vigenciaMeses: string;
  vigenciaDias:  string;
  fechaRenovar:  string;
  diagnostico:   string;
}

const EMPTY_FORM: FormData = {
  sucursal: "", numContrato: "", nombre: "",
  expediente: "", tpDer: "T", clinica: "", servicio: "",
  fechaSoporte: "", vigenciaMeses: "", vigenciaDias: "",
  fechaRenovar: "", diagnostico: "",
};

function toFormData(c: ContratoOxigeno): FormData {
  return {
    sucursal:      c.sucursal,
    numContrato:   c.numContrato,
    nombre:        c.nombre,
    expediente:    c.expediente,
    tpDer:         c.tpDer,
    clinica:       c.clinica,
    servicio:      c.servicio,
    fechaSoporte:  c.fechaSoporte  ?? "",
    vigenciaMeses: c.vigenciaMeses != null ? String(c.vigenciaMeses) : "",
    vigenciaDias:  c.vigenciaDias  != null ? String(c.vigenciaDias)  : "",
    fechaRenovar:  c.fechaRenovar  ?? "",
    diagnostico:   c.diagnostico,
  };
}

// ── Preview días faltan ───────────────────────────────────────────────────────

function previewDias(fechaRenovar: string): number | null {
  if (!fechaRenovar) return null;
  const diff = Math.floor(
    (new Date(fechaRenovar + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
  );
  return diff;
}

function previewStatus(dias: number | null): ContratoStatus | null {
  if (dias === null) return null;
  if (dias < 0) return "VENCIDO";
  if (dias <= 30) return "POR_VENCER";
  return "VIGENTE";
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  editing:      ContratoOxigeno | null;
  isSaving:     boolean;
  onSave:       (data: FormData, editing: ContratoOxigeno | null) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ContratoForm({ open, onOpenChange, editing, isSaving, onSave }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  useEffect(() => {
    setForm(editing ? toFormData(editing) : EMPTY_FORM);
  }, [editing, open]);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // fechaRenovar = fechaSoporte + vigenciaDias (fórmula Excel)
  const calcFechaRenovar = (fechaSoporte: string, vigenciaDias: string): string => {
    if (!fechaSoporte || !vigenciaDias) return "";
    const base = new Date(fechaSoporte + "T00:00:00");
    base.setDate(base.getDate() + Number(vigenciaDias));
    return base.toISOString().slice(0, 10);
  };

  const handleFechaSoporte = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fechaSoporte = e.target.value;
    setForm((prev) => ({
      ...prev,
      fechaSoporte,
      fechaRenovar: calcFechaRenovar(fechaSoporte, prev.vigenciaDias),
    }));
  };

  const handleVigenciaDias = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vigenciaDias = e.target.value;
    setForm((prev) => ({
      ...prev,
      vigenciaDias,
      fechaRenovar: calcFechaRenovar(prev.fechaSoporte, vigenciaDias),
    }));
  };

  const dias    = previewDias(form.fechaRenovar);
  const estatus = previewStatus(dias);

  const inputCls = "h-9 text-sm";
  const selectCls = `${inputCls} w-full rounded-md border border-line-struct bg-paper px-3`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar contrato" : "Nuevo contrato"}</DialogTitle>
          <DialogDescription>
            {editing
              ? `Modificando contrato ${editing.numContrato}`
              : "Completa los datos para registrar un nuevo contrato de equipo médico domiciliario."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">

          {/* Identificación */}
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-txt-muted">
              Identificación
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="cf-numContrato">N° Contrato *</Label>
                <Input id="cf-numContrato" className={inputCls} value={form.numContrato} onChange={set("numContrato")} placeholder="Ej. 70060" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="cf-nombre">Nombre completo *</Label>
                <Input id="cf-nombre" className={inputCls} value={form.nombre} onChange={set("nombre")} placeholder="Apellido paterno, materno, nombre" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-expediente">Expediente *</Label>
                <Input id="cf-expediente" className={inputCls} value={form.expediente} onChange={set("expediente")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-tpDer">Tipo derechohabiente *</Label>
                <select id="cf-tpDer" className={selectCls} value={form.tpDer} onChange={set("tpDer")}>
                  {(Object.entries(TP_DER_LABELS) as [TpDer, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Asignación */}
          <section className="space-y-3 border-t border-line-struct/50 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-txt-muted">
              Asignación
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="cf-sucursal">Sucursal *</Label>
                <select id="cf-sucursal" className={selectCls} value={form.sucursal} onChange={set("sucursal")}>
                  <option value="">Seleccionar...</option>
                  {SUCURSALES.map((s) => <option key={s} value={s}>{s}</option>)}
                  {form.sucursal && !SUCURSALES.includes(form.sucursal) && (
                    <option value={form.sucursal}>{form.sucursal}</option>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-clinica">Clínica *</Label>
                <Input id="cf-clinica" className={inputCls} value={form.clinica} onChange={set("clinica")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-servicio">Servicio / Equipo *</Label>
                <select id="cf-servicio" className={selectCls} value={form.servicio} onChange={set("servicio")}>
                  <option value="">Seleccionar...</option>
                  {SERVICIOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  {form.servicio && !SERVICIOS.includes(form.servicio) && (
                    <option value={form.servicio}>{form.servicio}</option>
                  )}
                </select>
              </div>
            </div>
          </section>

          {/* Fechas y vigencia */}
          <section className="space-y-3 border-t border-line-struct/50 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-txt-muted">
              Fechas y vigencia
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="cf-fechaSoporte">Fecha soporte</Label>
                <Input id="cf-fechaSoporte" className={inputCls} type="date" value={form.fechaSoporte} onChange={handleFechaSoporte} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-vigenciaMeses">Vigencia (meses)</Label>
                <Input id="cf-vigenciaMeses" className={inputCls} type="number" min={0} value={form.vigenciaMeses} onChange={set("vigenciaMeses")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-vigenciaDias">Vigencia (días)</Label>
                <Input id="cf-vigenciaDias" className={inputCls} type="number" min={0} value={form.vigenciaDias} onChange={handleVigenciaDias} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cf-fechaRenovar">
                Fecha límite para renovar
                <span className="ml-2 text-[10px] font-normal text-txt-muted">
                  (Fecha soporte + días)
                </span>
              </Label>
              <Input
                id="cf-fechaRenovar"
                className={`${inputCls} bg-subtle/30`}
                type="date"
                value={form.fechaRenovar}
                readOnly
                tabIndex={-1}
              />
            </div>

            {/* Preview status */}
            {form.fechaRenovar && estatus ? (
              <div className="rounded-lg border border-line-struct/50 bg-subtle/20 px-4 py-2 text-sm">
                <span className="text-txt-muted">Preview: </span>
                <span className={
                  estatus === "VENCIDO"    ? "font-semibold text-red-600"    :
                  estatus === "POR_VENCER" ? "font-semibold text-amber-600"  :
                                            "font-semibold text-green-600"
                }>
                  {estatus === "VENCIDO"
                    ? `Vencido hace ${Math.abs(dias!)} días`
                    : `${dias} días — ${CONTRATO_STATUS_LABELS[estatus]}`}
                </span>
              </div>
            ) : null}
          </section>

          {/* Diagnóstico */}
          <section className="space-y-3 border-t border-line-struct/50 pt-4">
            <div className="space-y-1">
              <Label htmlFor="cf-diagnostico">Diagnóstico</Label>
              <Input id="cf-diagnostico" className={inputCls} value={form.diagnostico} onChange={set("diagnostico")} placeholder="Diagnóstico médico" />
            </div>
          </section>

          {/* Acciones */}
          <div className="flex justify-end gap-2 border-t border-line-struct pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSaving || !form.numContrato || !form.nombre || !form.sucursal || !form.expediente}
              onClick={() => onSave(form, editing)}
            >
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {editing ? "Guardar cambios" : "Crear contrato"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { FormData as ContratoFormData };
