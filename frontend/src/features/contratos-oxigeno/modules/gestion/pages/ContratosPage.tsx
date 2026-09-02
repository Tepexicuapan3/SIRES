import { useState } from "react";
import { Bell, ClipboardList, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Input }  from "@shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import {
  CONTRATO_STATUS, TP_DER_LABELS,
  type ContratoOxigeno, type ContratoStatus, type TpDer, type ContratosListParams,
} from "@api/types";
import { useContratosList }  from "@features/contratos-oxigeno/queries/useContratosList";
import { useContratosStats } from "@features/contratos-oxigeno/queries/useContratosStats";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import {
  useCreateContrato,
  useUpdateContrato,
} from "@features/contratos-oxigeno/mutations/useContratoMutations";
import { useDescargarFormatoOxigeno } from "@features/contratos-oxigeno/mutations/useDescargarFormatoOxigeno";
import { ContratoStatsCards }     from "../components/ContratoStatsCards";
import { ContratoTable }           from "../components/ContratoTable";
import { ContratoForm, type ContratoFormData } from "../components/ContratoForm";
import { NotificacionesDrawer }    from "../components/NotificacionesDrawer";

// ── Tipos internos ────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildOrdering(field: string, dir: SortDir): string | undefined {
  if (!field || !dir) return undefined;
  return dir === "desc" ? `-${field}` : field;
}

function formDataToPayload(data: ContratoFormData) {
  return {
    sucursal:      data.sucursal,
    numContrato:   data.numContrato,
    nombre:        data.nombre,
    expediente:    data.expediente,
    pkNum:         data.pkNum,
    fechaNacimiento: data.fechaNacimiento || null,
    tpDer:         data.tpDer,
    clinica:       data.clinica,
    servicio:      data.servicio,
    servicio2:     data.servicio2 || null,
    servicio3:     data.servicio3 || null,
    telefono:      data.telefono  || "",
    fechaSoporte:  data.fechaSoporte  || null,
    vigenciaMeses: data.vigenciaMeses ? Number(data.vigenciaMeses) : null,
    vigenciaDias:  data.vigenciaDias  ? Number(data.vigenciaDias)  : null,
    fechaRenovar:  data.fechaRenovar  || null,
    diagnostico:   data.diagnostico  || "",
    calle:         data.calle         || "",
    numExt:        data.numExt        || "",
    numInt:        data.numInt        || "",
    colonia:       data.colonia       || "",
    alcaldia:      data.alcaldia      || "",
    cp:            data.cp            || "",
    entreCalle1:   data.entreCalle1   || "",
    entreCalle2:   data.entreCalle2   || "",
    telOficina:    data.telOficina    || "",
    celular:       data.celular       || "",
    extTel:        data.extTel        || "",
    hospitalAzura: data.hospitalAzura,
    medicoTratante: data.medicoTratante || "",
    especialidad:   data.especialidad   || "",
    tercerNivel:    data.tercerNivel,
    institucionReferencia:    data.institucionReferencia    || "",
    medicoTratanteReferencia: data.medicoTratanteReferencia || "",
    tramiteSubsecuente:       data.tramiteSubsecuente,
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ContratosPage() {
  // ── Estado de filtros y paginación ─────────────────────────────────────────
  const [search,    setSearch]    = useState("");
  const [sucursal,  setSucursal]  = useState("");
  const [clinica,   setClinica]   = useState("");
  const [status,    setStatus]    = useState<ContratoStatus | "">("");
  const [tpDer,     setTpDer]     = useState<TpDer | "">("");
  const [page,      setPage]      = useState(1);
  const [sortField, setSortField] = useState("num_contrato");
  const [sortDir,   setSortDir]   = useState<SortDir>("asc");

  // ── Estado modal formulario ────────────────────────────────────────────────
  const [formOpen,  setFormOpen]  = useState(false);
  const [editing,   setEditing]   = useState<ContratoOxigeno | null>(null);

  // ── Estado drawer notificaciones ──────────────────────────────────────────
  const [notiOpen,       setNotiOpen]       = useState(false);
  const [notiPreselected, setNotiPreselected] = useState<ContratoOxigeno | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const queryParams: ContratosListParams = {
    page,
    pageSize: 20,
    search:   search   || undefined,
    sucursal: sucursal || undefined,
    clinica:  clinica  || undefined,
    status:   (status  || undefined) as ContratoStatus | undefined,
    tpDer:    (tpDer   || undefined) as TpDer | undefined,
    ordering: buildOrdering(sortField, sortDir),
  };

  const listQuery  = useContratosList(queryParams);
  const statsQuery = useContratosStats();

  const { data: centrosData } = useCentrosAtencionList({ pageSize: 200, isActive: true });
  const clinicaOptions = centrosData?.items ?? [];

  const contratos   = listQuery.data?.items      ?? [];
  const total       = listQuery.data?.total      ?? 0;
  const totalPages  = listQuery.data?.totalPages ?? 1;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useCreateContrato();
  const updateMutation = useUpdateContrato();
  const { descargar } = useDescargarFormatoOxigeno();
  const [descargandoId, setDescargandoId] = useState<number | null>(null);

  const isSaving  = createMutation.isPending || updateMutation.isPending;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => d === "asc" ? "desc" : d === "desc" ? null : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (contrato: ContratoOxigeno) => {
    setEditing(contrato);
    setFormOpen(true);
  };

  const handleSave = async (data: ContratoFormData, current: ContratoOxigeno | null) => {
    const payload = formDataToPayload(data);
    try {
      if (current) {
        await updateMutation.mutateAsync({ id: current.id, data: payload });
        toast.success("Contrato actualizado.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Contrato creado.");
      }
      setFormOpen(false);
    } catch {
      toast.error("No se pudo guardar el contrato. Verifica los datos e intenta nuevamente.");
    }
  };

  const handleFilterChange = () => setPage(1);

  const handleDescargarFormato = async (contrato: ContratoOxigeno) => {
    setDescargandoId(contrato.id);
    try {
      await descargar(contrato);
    } catch {
      toast.error("No se pudo generar el formato. Intenta nuevamente.");
    } finally {
      setDescargandoId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="space-y-5 p-6">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 rounded-xl border border-line-struct bg-paper p-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-line-hairline bg-subtle px-3 py-1 text-xs font-medium text-txt-muted">
            <ClipboardList className="size-3.5" />
            Equipo médico domiciliario
          </div>
          <h1 className="text-2xl font-semibold text-txt-body">
            Contratos de oxígeno y equipo
          </h1>
          <p className="max-w-2xl text-sm text-txt-muted">
            Gestiona contratos de derechohabientes, vigencias y fechas de renovación.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() => { void listQuery.refetch(); void statsQuery.refetch(); }}
          >
            <RefreshCcw className="size-4" /> Actualizar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => { setNotiPreselected(null); setNotiOpen(true); }}
          >
            <Bell className="size-4" /> Notificaciones
          </Button>
          <Button type="button" className="gap-2" onClick={handleOpenCreate}>
            <Plus className="size-4" /> Nuevo contrato
          </Button>
        </div>
      </header>

      {/* ── Cards de estadísticas ──────────────────────────────────────── */}
      <ContratoStatsCards stats={statsQuery.data} isLoading={statsQuery.isLoading} />

      {/* ── Filtros ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-line-struct bg-paper p-4">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">

          <div className="sm:col-span-2">
            <Input
              placeholder="Buscar por nombre, N° contrato o expediente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
            />
          </div>

          <Select
            value={status || "__all__"}
            onValueChange={(v) => { setStatus(v === "__all__" ? "" : v as ContratoStatus); handleFilterChange(); }}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              <SelectItem value={CONTRATO_STATUS.VIGENTE}>Vigente</SelectItem>
              <SelectItem value={CONTRATO_STATUS.POR_VENCER}>Por Vencer</SelectItem>
              <SelectItem value={CONTRATO_STATUS.VENCIDO}>Vencido</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={tpDer || "__all__"}
            onValueChange={(v) => { setTpDer(v === "__all__" ? "" : v as TpDer); handleFilterChange(); }}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los tipos</SelectItem>
              {(Object.entries(TP_DER_LABELS) as [TpDer, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{k} — {v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filtrar por sucursal..."
            value={sucursal}
            onChange={(e) => { setSucursal(e.target.value); handleFilterChange(); }}
          />

          <Select
            value={clinica || "__all__"}
            onValueChange={(v) => { setClinica(v === "__all__" ? "" : v); handleFilterChange(); }}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las clínicas</SelectItem>
              {clinicaOptions.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────── */}
      <ContratoTable
        contratos={contratos}
        isLoading={listQuery.isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={20}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        onPage={setPage}
        onEdit={handleOpenEdit}
        onDescargarFormato={handleDescargarFormato}
        descargandoId={descargandoId}
      />

      {/* ── Drawer notificaciones ────────────────────────────────────── */}
      <NotificacionesDrawer
        open={notiOpen}
        onOpenChange={setNotiOpen}
        preselected={notiPreselected}
      />

      {/* ── Modal formulario ──────────────────────────────────────────── */}
      <ContratoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        isSaving={isSaving}
        onSave={handleSave}
      />

    </section>
  );
}

export default ContratosPage;
