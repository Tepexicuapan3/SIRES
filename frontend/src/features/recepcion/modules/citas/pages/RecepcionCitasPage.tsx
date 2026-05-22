import { useState } from "react";
import {
  Ban, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  Loader2, Plus, RotateCcw, UserCheck, UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Badge }    from "@shared/ui/badge";
import { Button }   from "@shared/ui/button";
import { Input }    from "@shared/ui/input";
import { Label }    from "@shared/ui/label";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@shared/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@shared/ui/tooltip";
import { useDebounce } from "@shared/hooks/useDebounce";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { ESTATUS_CITA, type CitaListItem, type EstatusCita } from "@api/types";
import { useCitasList }        from "@features/recepcion/modules/citas/queries/useCitasList";
import { useUpdateEstatusCita } from "@features/recepcion/modules/citas/mutations/useCitaMutations";
import { CitaCreateDialog }    from "@features/recepcion/modules/citas/components/CitaCreateDialog";
import {
  CITAS_READ_PERMISSION, CITAS_WRITE_PERMISSION,
} from "@features/recepcion/shared/domain/recepcion.permissions";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useConsultoriosList }    from "@features/admin/modules/catalogos/consultorios/queries/useConsultoriosList";
import { useMedicosList }         from "@features/admin/modules/medicos/hooks/useMedicos";

// ─── Constantes ───────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const PAGE_SIZE = 20;

const ESTATUS_LABEL: Record<EstatusCita, string> = {
  agendada:   "Agendada",
  confirmada: "Confirmada",
  atendida:   "Atendida",
  cancelada:  "Cancelada",
  no_asistio: "No asistió",
};

const ESTATUS_VARIANT: Record<EstatusCita,
  "outline" | "stable" | "alert" | "secondary" | "critical"
> = {
  agendada:   "outline",
  confirmada: "stable",
  atendida:   "secondary",
  cancelada:  "critical",
  no_asistio: "alert",
};

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Acciones por fila ────────────────────────────────────────────────────────

function CitaActions({ cita, canWrite }: { cita: CitaListItem; canWrite: boolean }) {
  const update = useUpdateEstatusCita(cita.id);

  const handleUpdate = async (estatus: "confirmada" | "atendida" | "cancelada" | "no_asistio") => {
    try {
      await update.mutateAsync({ estatus });
      toast.success(`Cita marcada como "${ESTATUS_LABEL[estatus]}".`);
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string; status?: number };
      const msg =
        apiErr?.code === "ROLE_NOT_ALLOWED"  ? "No tienes permiso para cambiar el estatus." :
        apiErr?.code === "PERMISSION_DENIED" ? "Token CSRF inválido. Recarga la página." :
        apiErr?.message                       ? apiErr.message :
                                                "No se pudo actualizar el estatus.";
      toast.error(msg);
    }
  };

  if (!canWrite) return null;

  const isPending = update.isPending;

  // Acciones disponibles según estatus
  const esAgendada    = cita.estatus === ESTATUS_CITA.AGENDADA;
  const esConfirmada  = cita.estatus === ESTATUS_CITA.CONFIRMADA;
  const puedeActuar   = (esAgendada || esConfirmada) && !isPending;

  if (!puedeActuar && !isPending) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-center gap-1">
        {isPending ? (
          <Loader2 className="size-4 animate-spin text-txt-muted" />
        ) : (
          <>
            {/* Confirmar — solo si está agendada */}
            {esAgendada ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-txt-muted hover:bg-green-50 hover:text-green-600 transition-colors"
                    onClick={() => void handleUpdate(ESTATUS_CITA.CONFIRMADA)}
                  >
                    <CheckCircle2 className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Confirmar cita</TooltipContent>
              </Tooltip>
            ) : null}

            {/* Llegó (atendida) — solo si está confirmada */}
            {esConfirmada ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-txt-muted hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => void handleUpdate(ESTATUS_CITA.ATENDIDA)}
                  >
                    <UserCheck className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Llegó — marcar como atendida</TooltipContent>
              </Tooltip>
            ) : null}

            {/* No asistió — solo si está confirmada */}
            {esConfirmada ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-txt-muted hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    onClick={() => void handleUpdate(ESTATUS_CITA.NO_ASISTIO)}
                  >
                    <UserX className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>No asistió</TooltipContent>
              </Tooltip>
            ) : null}

            {/* Cancelar — agendada o confirmada */}
            {(esAgendada || esConfirmada) ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-txt-muted hover:bg-red-50 hover:text-status-critical transition-colors"
                    onClick={() => void handleUpdate(ESTATUS_CITA.CANCELADA)}
                  >
                    <Ban className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Cancelar cita</TooltipContent>
              </Tooltip>
            ) : null}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function RecepcionCitasPage() {
  const { hasCapability } = usePermissionDependencies();
  const canRead  = hasCapability("recepcion.citas.read",  { anyOf: [CITAS_READ_PERMISSION,  CITAS_WRITE_PERMISSION] });
  const canWrite = hasCapability("recepcion.citas.write", { anyOf: [CITAS_WRITE_PERMISSION] });

  // ── Estado de filtros ───────────────────────────────────────────────────────
  const [createOpen,    setCreateOpen]    = useState(false);
  const [page,          setPage]          = useState(1);
  const [search,        setSearch]        = useState("");  // folio (CIT-) o expediente
  const [estatus,       setEstatus]       = useState<EstatusCita | "all">("all");
  const [fechaDesde,    setFechaDesde]    = useState(TODAY);
  const [fechaHasta,    setFechaHasta]    = useState("");
  const [centroId,      setCentroId]      = useState<number | "all">("all");
  const [medicoId,      setMedicoId]      = useState<number | "all">("all");
  const [consultorioId, setConsultorioId] = useState<number | "all">("all");

  const debouncedSearch = useDebounce(search, 400);
  // Detecta si la búsqueda es por folio (empieza con CIT-) o expediente
  const isFolloSearch = debouncedSearch.toUpperCase().startsWith("CIT");
  const folioFilter   = isFolloSearch ? debouncedSearch.toUpperCase() : undefined;
  const noExpFilter   = !isFolloSearch && debouncedSearch ? debouncedSearch : undefined;

  // ── Catálogos para filtros (carga única, filtrado client-side) ──────────────
  const { data: centrosData } = useCentrosAtencionList({ isActive: true });
  const centroOptions = centrosData?.items ?? [];

  const { data: consultoriosData } = useConsultoriosList({ isActive: true, pageSize: 500 });
  const allConsultorios = consultoriosData?.items ?? [];

  const { data: medicosData } = useMedicosList({ estatusMedico: "ACTIVO" });
  const allMedicos = medicosData?.items ?? [];

  // Filtrado client-side por centro seleccionado
  const selectedCentro = centroId !== "all" ? centroId : null;
  const consultorioOptions = selectedCentro
    ? allConsultorios.filter((c) => c.centerId === selectedCentro)
    : allConsultorios;
  const medicoOptions = selectedCentro
    ? allMedicos.filter((m) => m.centros.some((mc) => mc.centroId === selectedCentro))
    : allMedicos;

  // ── Query de citas ──────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useCitasList(
    {
      page,
      pageSize:     PAGE_SIZE,
      noExp:        noExpFilter,
      folio:        folioFilter,
      estatus:      estatus      !== "all" ? estatus      : undefined,
      centroId:     centroId     !== "all" ? centroId     : undefined,
      medicoId:     medicoId     !== "all" ? medicoId     : undefined,
      consultorioId: consultorioId !== "all" ? consultorioId : undefined,
      fechaDesde:   fechaDesde || undefined,
      fechaHasta:   fechaHasta || undefined,
    },
    { enabled: canRead },
  );

  const citas      = data?.items      ?? [];
  const totalCitas = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ── Contador de filtros activos ─────────────────────────────────────────────
  const appliedFilters = [
    debouncedSearch.length > 0,
    estatus       !== "all",
    centroId      !== "all",
    medicoId      !== "all",
    consultorioId !== "all",
    fechaDesde    !== TODAY,
    fechaHasta.length > 0,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch("");
    setEstatus("all");
    setFechaDesde(TODAY);
    setFechaHasta("");
    setCentroId("all");
    setMedicoId("all");
    setConsultorioId("all");
    setPage(1);
  };

  const handleCentroChange = (value: string) => {
    setCentroId(value === "all" ? "all" : Number(value));
    setMedicoId("all");
    setConsultorioId("all");
    setPage(1);
  };

  return (
    <div className="space-y-5 p-6">

      {/* ── Encabezado ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
            <CalendarDays className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-txt-body">Citas médicas</h1>
            <p className="text-xs text-txt-muted">
              {data ? `${totalCitas} citas` : "Agenda y seguimiento de citas"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="icon" className="size-9"
            disabled={isFetching}
            onClick={() => void refetch()}
            title="Actualizar"
          >
            <RotateCcw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>

          {canWrite ? (
            <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Nueva cita
            </Button>
          ) : null}
        </div>
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-line-struct/60 bg-subtle/10 p-4">
        {/* Fila 1: expediente, estatus, fechas */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 w-52">
            <Label className="text-xs">
              Folio o expediente
            </Label>
            <Input
              placeholder="CIT-… o número de expediente"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9"
            />
          </div>

          <div className="space-y-1 w-44">
            <Label className="text-xs">Estatus</Label>
            <Select value={estatus} onValueChange={(v) => { setEstatus(v as EstatusCita | "all"); setPage(1); }}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estatus</SelectItem>
                {(Object.entries(ESTATUS_LABEL) as [EstatusCita, string][]).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 w-36">
            <Label className="text-xs">Desde</Label>
            <Input
              type="date"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              className="h-9"
            />
          </div>

          <div className="space-y-1 w-36">
            <Label className="text-xs">Hasta <span className="text-txt-muted font-normal">(opc.)</span></Label>
            <Input
              type="date"
              value={fechaHasta}
              min={fechaDesde}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              className="h-9"
            />
          </div>
        </div>

        {/* Fila 2: centro, consultorio, médico — cascada */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 w-48">
            <Label className="text-xs">Centro de atención</Label>
            <select
              className="h-9 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              value={centroId === "all" ? "all" : String(centroId)}
              onChange={(e) => handleCentroChange(e.target.value)}
            >
              <option value="all">Todos los centros</option>
              {centroOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 w-48">
            <Label className="text-xs">Consultorio</Label>
            <select
              className="h-9 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              value={consultorioId === "all" ? "all" : String(consultorioId)}
              onChange={(e) => { setConsultorioId(e.target.value === "all" ? "all" : Number(e.target.value)); setPage(1); }}
            >
              <option value="all">Todos los consultorios</option>
              {consultorioOptions.map((c) => (
                <option key={c.id} value={c.id}>#{c.numero} — {c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 w-52">
            <Label className="text-xs">Médico</Label>
            <select
              className="h-9 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
              value={medicoId === "all" ? "all" : String(medicoId)}
              onChange={(e) => { setMedicoId(e.target.value === "all" ? "all" : Number(e.target.value)); setPage(1); }}
            >
              <option value="all">Todos los médicos</option>
              {medicoOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.nombreCompleto}</option>
              ))}
            </select>
          </div>

          {appliedFilters > 0 ? (
            <Button
              variant="ghost" size="sm" className="h-9 self-end text-txt-muted"
              onClick={resetFilters}
            >
              Limpiar ({appliedFilters})
            </Button>
          ) : null}
        </div>
      </div>

      {/* ── Tabla ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-line-struct">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-struct bg-subtle/30">
              {["Folio", "Expediente", "Médico", "Consultorio", "Fecha y hora", "Servicio", "Motivo", "Estatus", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-txt-muted uppercase last:text-center"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line-struct/60">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-3 w-16 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : citas.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-txt-muted">
                  Sin citas para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              citas.map((cita) => (
                <tr key={cita.id} className="hover:bg-subtle/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-txt-muted">{cita.folio}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {cita.noExp}
                    {cita.pkNum > 0 ? (
                      <span className="ml-1 font-sans text-txt-muted">· fam.{cita.pkNum}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[160px] truncate">{cita.medicoNombre}</td>
                  <td className="px-4 py-3 text-xs text-txt-muted">
                    {cita.consultorioNombre ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">{formatFechaHora(cita.fechaHora)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {cita.servicioTipo.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="max-w-[140px] px-4 py-3">
                    <p className="truncate text-xs text-txt-muted">{cita.motivo ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ESTATUS_VARIANT[cita.estatus]} className="text-xs">
                      {ESTATUS_LABEL[cita.estatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CitaActions cita={cita} canWrite={canWrite} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ───────────────────────────────────────────────── */}
      {totalCitas > 0 ? (
        <div className="flex items-center justify-between text-xs text-txt-muted">
          <span>
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCitas)} de {totalCitas} citas
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="size-7"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2">Página {page} de {totalPages}</span>
            <Button
              variant="ghost" size="icon" className="size-7"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <CitaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

export default RecepcionCitasPage;
