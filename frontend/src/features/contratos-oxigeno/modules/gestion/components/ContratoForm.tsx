import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input }  from "@shared/ui/input";
import { Label }  from "@shared/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@shared/ui/dialog";
import {
  CONTRATO_STATUS_LABELS,
  type ContratoOxigeno, type ContratoStatus, type DerechohabienteResult,
} from "@api/types";
import { useBuscarDerechohabiente } from "@features/contratos-oxigeno/queries/useBuscarDerechohabiente";
import { useSucursalesList } from "@features/admin/modules/catalogos/sucursales/queries/useSucursalesList";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { CatalogCombobox } from "./CatalogCombobox";

// ── Constantes ────────────────────────────────────────────────────────────────

const SERVICIOS = ["CONCENTRADOR", "CPAP", "BIPAP", "NEBULIZADOR", "OTRO EQUIPO"];

// ── Tipos del formulario ──────────────────────────────────────────────────────

interface FormData {
  sucursal:      string;
  numContrato:   string;
  nombre:        string;
  expediente:    string;
  tpDer:         string;
  clinica:       string;
  servicio:      string;
  servicio2:     string;
  servicio3:     string;
  telefono:      string;
  direccion:     string;
  fechaSoporte:  string;
  vigenciaMeses: string;
  vigenciaDias:  string;
  fechaRenovar:  string;
  diagnostico:   string;
}

const EMPTY_FORM: FormData = {
  sucursal: "", numContrato: "", nombre: "",
  expediente: "", tpDer: "T", clinica: "", servicio: "",
  servicio2: "", servicio3: "", telefono: "", direccion: "",
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
    servicio2:     c.servicio2 ?? "",
    servicio3:     c.servicio3 ?? "",
    telefono:      c.telefono  ?? "",
    direccion:     c.direccion ?? "",
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
  if (dias <= 15) return "POR_VENCER";
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

// ── Vigencia (cat_empleados / cat_familiar) ───────────────────────────────────

const VIGENCIA_CLS: Record<DerechohabienteResult["vigencia"], string> = {
  ACTIVO:    "text-green-600",
  BAJA:      "text-red-600",
  "NO ACTIVO": "text-amber-600",
};

// ── Componente ────────────────────────────────────────────────────────────────

export function ContratoForm({ open, onOpenChange, editing, isSaving, onSave }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [dhQuery, setDhQuery]       = useState("");
  const [dhOpen, setDhOpen]         = useState(false);
  const [dhSelected, setDhSelected] = useState<DerechohabienteResult | null>(null);

  const { data: dhData, isFetching: dhLoading } = useBuscarDerechohabiente(dhQuery);
  const dhResults = dhData?.results ?? [];

  // Catálogo de centros de atención (clínicas) para el combobox de "Asignación"
  const { data: centrosData } = useCentrosAtencionList({ pageSize: 200, isActive: true });
  const clinicaOptions = (centrosData?.items ?? []).map((c) => ({ id: c.id, name: c.name }));

  // Catálogo de sucursales para el combobox de "Asignación"
  const { data: sucursalesData } = useSucursalesList({ pageSize: 200, isActive: true });
  const sucursalOptions = (sucursalesData?.items ?? []).map((s) => ({ id: s.id, name: s.name }));

  useEffect(() => {
    setForm(editing ? toFormData(editing) : EMPTY_FORM);
    setDhQuery("");
    setDhSelected(null);
    setDhOpen(false);
  }, [editing, open]);

  const handleSelectDerechohabiente = (resultado: DerechohabienteResult) => {
    setForm((prev) => ({
      ...prev,
      nombre:    resultado.nombre,
      expediente: resultado.expediente,
      tpDer:     resultado.tpDer,
    }));
    setDhSelected(resultado);
    setDhOpen(false);
    setDhQuery("");
  };

  // Vigencia/nacimiento/edad del derechohabiente: del registro ya guardado al editar,
  // o del resultado seleccionado en el buscador al dar de alta.
  const vigenciaInfo = editing
    ? (editing.vigenciaDh
        ? {
            vigencia:        editing.vigenciaDh,
            fechaNacimiento: editing.fechaNacimientoDh,
            edad:            editing.edadDh,
          }
        : null)
    : (dhSelected
        ? {
            vigencia:        dhSelected.vigencia,
            fechaNacimiento: dhSelected.fechaNacimiento,
            edad:            dhSelected.edad,
          }
        : null);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // fechaRenovar = fechaSoporte + vigenciaDias (fórmula Excel)
  const calcFechaRenovar = (fechaSoporte: string, vigenciaDias: string): string => {
    if (!fechaSoporte || !vigenciaDias) return "";
    const base = new Date(fechaSoporte + "T00:00:00");
    base.setDate(base.getDate() + Number(vigenciaDias));
    return base.toISOString().slice(0, 10);
  };

  // Suma meses de calendario; si el día no existe en el mes destino, usa el último día de ese mes
  const addCalendarMonths = (base: Date, months: number): Date => {
    const result = new Date(base);
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(base.getDate(), lastDay));
    return result;
  };

  // fechaRenovar = fechaSoporte + vigenciaMeses (calendario) → vigenciaDias se deriva de la diferencia real
  const calcFromMeses = (fechaSoporte: string, vigenciaMeses: string): { fechaRenovar: string; vigenciaDias: string } => {
    if (!fechaSoporte || !vigenciaMeses) return { fechaRenovar: "", vigenciaDias: "" };
    const base    = new Date(fechaSoporte + "T00:00:00");
    const renovar = addCalendarMonths(base, Number(vigenciaMeses));
    const dias    = Math.round((renovar.getTime() - base.getTime()) / 86_400_000);
    return { fechaRenovar: renovar.toISOString().slice(0, 10), vigenciaDias: String(dias) };
  };

  const handleFechaSoporte = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fechaSoporte = e.target.value;
    setForm((prev) => {
      if (prev.vigenciaMeses) {
        const { fechaRenovar, vigenciaDias } = calcFromMeses(fechaSoporte, prev.vigenciaMeses);
        return { ...prev, fechaSoporte, fechaRenovar, vigenciaDias };
      }
      return { ...prev, fechaSoporte, fechaRenovar: calcFechaRenovar(fechaSoporte, prev.vigenciaDias) };
    });
  };

  const handleVigenciaMeses = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vigenciaMeses = e.target.value;
    setForm((prev) => {
      if (!vigenciaMeses) return { ...prev, vigenciaMeses };
      const { fechaRenovar, vigenciaDias } = calcFromMeses(prev.fechaSoporte, vigenciaMeses);
      return { ...prev, vigenciaMeses, vigenciaDias, fechaRenovar };
    });
  };

  const handleVigenciaDias = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vigenciaDias = e.target.value;
    setForm((prev) => ({
      ...prev,
      vigenciaDias,
      vigenciaMeses: "",
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

            {/* Buscador de derechohabiente (cat_empleados / cat_familiar) — solo en alta */}
            {!editing && (
              <div className="relative space-y-1">
                <Label htmlFor="cf-buscar-dh">Buscar derechohabiente (nombre o expediente)</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-txt-muted" />
                  <Input
                    id="cf-buscar-dh"
                    className={`${inputCls} pl-8`}
                    value={dhQuery}
                    onChange={(e) => { setDhQuery(e.target.value); setDhOpen(true); }}
                    onFocus={() => setDhOpen(true)}
                    onBlur={() => setTimeout(() => setDhOpen(false), 150)}
                    placeholder="Mín. 3 caracteres..."
                    autoComplete="off"
                  />
                </div>

                {dhOpen && dhQuery.trim().length >= 3 && (
                  <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-line-struct bg-paper shadow-lg">
                    {dhLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-txt-muted">
                        <Loader2 className="size-4 animate-spin" /> Buscando...
                      </div>
                    ) : dhResults.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-txt-muted">Sin coincidencias.</div>
                    ) : (
                      dhResults.map((r) => (
                        <button
                          key={`${r.tipo}-${r.expediente}-${r.pkNum ?? ""}`}
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-subtle/40"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectDerechohabiente(r)}
                        >
                          <span className="font-medium">{r.nombre}</span>
                          <span className="text-xs text-txt-muted">
                            Exp. {r.expediente} — {r.tpDerLabel}
                            {" — "}
                            <span className={VIGENCIA_CLS[r.vigencia]}>{r.vigencia}</span>
                            {r.edad != null ? ` — ${r.edad} años` : ""}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {vigenciaInfo && (
              <div className="rounded-lg border border-line-struct/50 bg-subtle/20 px-3 py-2 text-xs">
                <span className="text-txt-muted">Vigencia: </span>
                <span className={`font-semibold ${VIGENCIA_CLS[vigenciaInfo.vigencia]}`}>{vigenciaInfo.vigencia}</span>
                {vigenciaInfo.fechaNacimiento && (
                  <span className="ml-3 text-txt-muted">Nacimiento: <span className="text-txt-body">{vigenciaInfo.fechaNacimiento}</span></span>
                )}
                {vigenciaInfo.edad != null && (
                  <span className="ml-3 text-txt-muted">Edad: <span className="text-txt-body">{vigenciaInfo.edad} años</span></span>
                )}
              </div>
            )}

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
                <Input id="cf-tpDer" className={inputCls} value={form.tpDer} onChange={set("tpDer")} maxLength={100} placeholder="Ej. T, E, H1, ESPOSO..." />
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
                <CatalogCombobox
                  value={form.sucursal}
                  onChange={(name) => setForm((prev) => ({ ...prev, sucursal: name }))}
                  options={sucursalOptions}
                  placeholder="Selecciona una sucursal..."
                  searchPlaceholder="Buscar sucursal..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-clinica">Clínica *</Label>
                <CatalogCombobox
                  value={form.clinica}
                  onChange={(name) => setForm((prev) => ({ ...prev, clinica: name }))}
                  options={clinicaOptions}
                  placeholder="Selecciona una clínica..."
                  searchPlaceholder="Buscar centro de atención..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-servicio">Servicio / Equipo 1 *</Label>
                <select id="cf-servicio" className={selectCls} value={form.servicio} onChange={set("servicio")}>
                  <option value="">Seleccionar...</option>
                  {SERVICIOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  {form.servicio && !SERVICIOS.includes(form.servicio) && (
                    <option value={form.servicio}>{form.servicio}</option>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-servicio2">Servicio / Equipo 2</Label>
                <select id="cf-servicio2" className={selectCls} value={form.servicio2} onChange={set("servicio2")}>
                  <option value="">Sin asignar</option>
                  {SERVICIOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  {form.servicio2 && !SERVICIOS.includes(form.servicio2) && (
                    <option value={form.servicio2}>{form.servicio2}</option>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-servicio3">Servicio / Equipo 3</Label>
                <select id="cf-servicio3" className={selectCls} value={form.servicio3} onChange={set("servicio3")}>
                  <option value="">Sin asignar</option>
                  {SERVICIOS.map((s) => <option key={s} value={s}>{s}</option>)}
                  {form.servicio3 && !SERVICIOS.includes(form.servicio3) && (
                    <option value={form.servicio3}>{form.servicio3}</option>
                  )}
                </select>
              </div>
            </div>
          </section>

          {/* Contacto */}
          <section className="space-y-3 border-t border-line-struct/50 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-txt-muted">
              Contacto
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="cf-telefono">Teléfono</Label>
                <Input id="cf-telefono" className={inputCls} value={form.telefono} onChange={set("telefono")} placeholder="Ej. 5512345678" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cf-direccion">Dirección</Label>
                <Input id="cf-direccion" className={inputCls} value={form.direccion} onChange={set("direccion")} placeholder="Calle, número, colonia..." />
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
                <Input id="cf-vigenciaMeses" className={inputCls} type="number" min={0} value={form.vigenciaMeses} onChange={handleVigenciaMeses} />
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
