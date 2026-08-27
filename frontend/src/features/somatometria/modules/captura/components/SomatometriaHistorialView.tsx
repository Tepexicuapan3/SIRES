import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import type { VisitQueueItem, VisitVitalsPayload } from "@api/types";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useSomatometriaHistorial } from "@features/somatometria/modules/captura/queries/useSomatometriaHistorial";
import { SomatometriaPacienteHistorialDialog } from "@features/somatometria/modules/captura/components/SomatometriaPacienteHistorialDialog";
import {
  resolvePreset,
  type DateRangePreset,
} from "@features/somatometria/modules/captura/domain/date-range-presets";

const DATE_PRESET_LABEL: Record<DateRangePreset, string> = {
  hoy: "Hoy",
  semana: "Semana",
  mes: "Mes",
  anio: "Año",
};

const DATE_PRESETS: DateRangePreset[] = ["hoy", "semana", "mes", "anio"];

interface SelectedPaciente {
  noExp: string;
  pkNum: number;
  nombrePaciente: string | null;
}

/** Fecha+hora legible -- mismo criterio de formato que `formatDateTime` en
 * `SomatometriaQueueCards.tsx` (dia/mes/año + hora:minuto, 24h, es-MX).
 * Duplicado deliberado y minimo (no se exporta desde ese archivo porque
 * mezclaria exports de componente + funcion, lo cual rompe fast-refresh)
 * para mantener consistencia visual entre "En somatometria desde" y
 * "Signos vitales capturados". */
const formatVitalsCapturedAt = (iso: string): string =>
  new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

/** Visita con signos vitales ya capturados -- estrecha `vitals` para que
 * `visit.vitals.capturedAt` no necesite un `!` en el render. */
type VisitWithVitals = VisitQueueItem & { vitals: VisitVitalsPayload };

const hasVitals = (visit: VisitQueueItem): visit is VisitWithVitals =>
  visit.vitals !== null;

/** Historial de signos vitales: fichas de visitas que YA tienen vitales
 * capturados (`vitals !== null`), filtrables por centro de atencion y rango
 * de fecha (con presets Hoy/Semana/Mes/Año en tiempo LOCAL, D12). Vista de
 * solo lectura -- sin acciones de escritura, a diferencia de la cola de
 * captura (`SomatometriaCapturePage`). Cada tarjeta abre el historial
 * completo de ESE paciente (`SomatometriaPacienteHistorialDialog`, D14).
 *
 * Sigue el mismo patron que la "Bandeja historica" de
 * `RecepcionAgendaPage.tsx`: fetch por rango de fecha via `visitsAPI.getAll`
 * (envuelto en `useSomatometriaHistorial`), paginado desde el backend.
 * `centroId` viaja como filtro REAL de backend (D3/D13) -- solo "tiene
 * vitales" sigue siendo client-side, porque el backend no expone ese filtro
 * de query. */
export function SomatometriaHistorialView() {
  const [centroFilter, setCentroFilter] = useState<number | "all">("all");
  const initialRange = resolvePreset("hoy");
  const [fechaDesde, setFechaDesde] = useState(initialRange.fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(initialRange.fechaHasta);
  const [activePreset, setActivePreset] = useState<DateRangePreset | null>(
    "hoy",
  );
  const [page, setPage] = useState(1);
  const [selectedPaciente, setSelectedPaciente] =
    useState<SelectedPaciente | null>(null);

  const { data: centrosData } = useCentrosAtencionList({ isActive: true });
  const centroOptions = (centrosData?.items ?? []).map((c) => ({
    id: c.id,
    nombre: c.name,
  }));

  const applyPreset = (preset: DateRangePreset) => {
    const range = resolvePreset(preset);
    setFechaDesde(range.fechaDesde);
    setFechaHasta(range.fechaHasta);
    setActivePreset(preset);
    setPage(1);
  };

  const { data, isLoading, isError } = useSomatometriaHistorial({
    page,
    pageSize: 50,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
    // `centroId` viaja como parametro REAL de backend (D3/D13) -- ya no se
    // filtra client-side sobre la pagina traida.
    centroId: centroFilter === "all" ? undefined : centroFilter,
  });

  const visits = data?.items ?? [];
  const visitsWithVitals = visits.filter(hasVitals);

  return (
    <div className="space-y-5" data-testid="somato-historial-view">
      {/* ── Filtros ──────────────────────────────────────────────── */}
      <section className="space-y-4 rounded-xl border border-line-struct bg-paper p-4">
        <div className="space-y-2">
          <Label>Rango de fecha</Label>
          <div
            className="flex flex-wrap gap-1.5"
            data-testid="somato-hist-date-presets"
          >
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                data-testid={`somato-hist-preset-${preset}`}
                onClick={() => applyPreset(preset)}
                className={[
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  activePreset === preset
                    ? "border-primary bg-primary text-white"
                    : "border-line-struct hover:border-primary/60 hover:bg-primary/5",
                ].join(" ")}
              >
                {DATE_PRESET_LABEL[preset]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="somato-hist-centro-filter">
              Centro de atención
            </Label>
            <Select
              value={centroFilter === "all" ? "all" : String(centroFilter)}
              onValueChange={(value) => {
                setCentroFilter(value === "all" ? "all" : Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger id="somato-hist-centro-filter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los centros</SelectItem>
                {centroOptions.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="somato-hist-desde">Desde</Label>
            <Input
              id="somato-hist-desde"
              type="date"
              value={fechaDesde}
              onChange={(event) => {
                setFechaDesde(event.target.value);
                setActivePreset(null);
                setPage(1);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="somato-hist-hasta">
              Hasta <span className="font-normal text-txt-muted">(opc.)</span>
            </Label>
            <Input
              id="somato-hist-hasta"
              type="date"
              value={fechaHasta}
              min={fechaDesde}
              onChange={(event) => {
                setFechaHasta(event.target.value);
                setActivePreset(null);
                setPage(1);
              }}
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <p className="text-sm text-txt-muted">Cargando historial...</p>
      ) : null}

      {isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>
            No se pudo cargar el historial de signos vitales.
          </AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !isError && visitsWithVitals.length === 0 ? (
        <p className="text-sm text-txt-muted">
          Sin signos vitales capturados para el rango y centro seleccionados.
        </p>
      ) : null}

      {!isLoading && !isError && visitsWithVitals.length > 0 ? (
        <div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          data-testid="somato-historial-cards"
        >
          {visitsWithVitals.map((visit) => (
            <article
              key={visit.id}
              data-testid={`somato-historial-card-${visit.id}`}
              role="button"
              tabIndex={0}
              onClick={() =>
                setSelectedPaciente({
                  noExp: visit.noExp,
                  pkNum: visit.pkNum,
                  nombrePaciente: visit.nombrePaciente,
                })
              }
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setSelectedPaciente({
                  noExp: visit.noExp,
                  pkNum: visit.pkNum,
                  nombrePaciente: visit.nombrePaciente,
                });
              }}
              className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-line-struct bg-paper text-left transition-colors hover:border-primary/60"
            >
              {/* Banda superior: folio + centro */}
              <div className="flex items-center justify-between gap-2 border-b border-line-hairline bg-subtle/30 px-4 py-2">
                <span className="font-mono text-xs text-txt-muted">
                  {visit.folio}
                </span>
                {visit.centroNombre ? (
                  <Badge variant="outline" className="truncate">
                    {visit.centroNombre}
                  </Badge>
                ) : null}
              </div>

              {/* Datos del paciente + fecha de captura */}
              <div className="px-4 py-3">
                {visit.nombrePaciente ? (
                  <p className="truncate text-sm font-bold text-txt-body">
                    {visit.nombrePaciente}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-txt-muted">
                    Sin nombre registrado
                  </p>
                )}
                <p className="mt-0.5 font-mono text-xs text-txt-muted">
                  Exp.&nbsp;
                  <span className="font-semibold text-txt-body">
                    {visit.noExp || "—"}
                  </span>
                  {visit.pkNum > 0 ? (
                    <span className="ml-1 font-sans font-normal">
                      {" "}
                      · Familiar #{visit.pkNum}
                    </span>
                  ) : (
                    <span className="ml-1 font-sans font-normal"> · Titular</span>
                  )}
                </p>
                <p className="mt-1.5 text-xs text-txt-muted">
                  Signos vitales capturados:{" "}
                  <span className="font-mono font-semibold text-txt-body">
                    {formatVitalsCapturedAt(visit.vitals.capturedAt)}
                  </span>
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {/* ── Paginación ───────────────────────────────────────────── */}
      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-xl border border-line-struct bg-paper px-4 py-2">
          <p className="text-xs text-txt-muted">
            {data.total} ficha(s) · página {page} de {data.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}

      <SomatometriaPacienteHistorialDialog
        open={selectedPaciente !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPaciente(null);
        }}
        noExp={selectedPaciente?.noExp}
        pkNum={selectedPaciente?.pkNum}
        nombrePaciente={selectedPaciente?.nombrePaciente}
      />
    </div>
  );
}

export default SomatometriaHistorialView;
