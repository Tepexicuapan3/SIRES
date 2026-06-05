import { useState } from "react";
import { ClipboardList, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Input }  from "@shared/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import {
  CONTRATO_STATUS, TP_DER_LABELS,
  type ContratoOxigeno, type ContratoStatus, type TpDer, type ContratosListParams,
} from "@api/types";
import { useContratosList }  from "@features/contratos-oxigeno/queries/useContratosList";
import { useContratosStats } from "@features/contratos-oxigeno/queries/useContratosStats";
import {
  useCreateContrato,
  useDeleteContrato,
  useUpdateContrato,
} from "@features/contratos-oxigeno/mutations/useContratoMutations";
import { ContratoStatsCards } from "../components/ContratoStatsCards";
import { ContratoTable }      from "../components/ContratoTable";
import { ContratoForm, type ContratoFormData } from "../components/ContratoForm";

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
    tpDer:         data.tpDer as TpDer,
    clinica:       data.clinica,
    servicio:      data.servicio,
    fechaSoporte:  data.fechaSoporte  || null,
    vigenciaMeses: data.vigenciaMeses ? Number(data.vigenciaMeses) : null,
    vigenciaDias:  data.vigenciaDias  ? Number(data.vigenciaDias)  : null,
    fechaRenovar:  data.fechaRenovar  || null,
    diagnostico:   data.diagnostico  || "",
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ContratosPage() {
  // ── Estado de filtros y paginación ─────────────────────────────────────────
  const [search,    setSearch]    = useState("");
  const [sucursal,  setSucursal]  = useState("");
  const [status,    setStatus]    = useState<ContratoStatus | "">("");
  const [tpDer,     setTpDer]     = useState<TpDer | "">("");
  const [page,      setPage]      = useState(1);
  const [sortField, setSortField] = useState("num_contrato");
  const [sortDir,   setSortDir]   = useState<SortDir>("asc");

  // ── Estado modal formulario ────────────────────────────────────────────────
  const [formOpen,  setFormOpen]  = useState(false);
  const [editing,   setEditing]   = useState<ContratoOxigeno | null>(null);

  // ── Estado confirmación eliminación ───────────────────────────────────────
  const [deleting,  setDeleting]  = useState<ContratoOxigeno | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const queryParams: ContratosListParams = {
    page,
    pageSize: 20,
    search:   search   || undefined,
    sucursal: sucursal || undefined,
    status:   (status  || undefined) as ContratoStatus | undefined,
    tpDer:    (tpDer   || undefined) as TpDer | undefined,
    ordering: buildOrdering(sortField, sortDir),
  };

  const listQuery  = useContratosList(queryParams);
  const statsQuery = useContratosStats();

  const contratos   = listQuery.data?.items      ?? [];
  const total       = listQuery.data?.total      ?? 0;
  const totalPages  = listQuery.data?.totalPages ?? 1;

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useCreateContrato();
  const updateMutation = useUpdateContrato();
  const deleteMutation = useDeleteContrato();

  const isSaving  = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

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

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success(`Contrato ${deleting.numContrato} eliminado.`);
    } catch {
      toast.error("No se pudo eliminar el contrato.");
    } finally {
      setDeleting(null);
    }
  };

  const handleFilterChange = () => setPage(1);

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

          <select
            className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
            value={status}
            onChange={(e) => { setStatus(e.target.value as ContratoStatus | ""); handleFilterChange(); }}
          >
            <option value="">Todos los estados</option>
            <option value={CONTRATO_STATUS.VIGENTE}>Vigente</option>
            <option value={CONTRATO_STATUS.POR_VENCER}>Por Vencer</option>
            <option value={CONTRATO_STATUS.VENCIDO}>Vencido</option>
          </select>

          <select
            className="h-10 w-full rounded-md border border-line-struct bg-paper px-3 text-sm"
            value={tpDer}
            onChange={(e) => { setTpDer(e.target.value as TpDer | ""); handleFilterChange(); }}
          >
            <option value="">Todos los tipos</option>
            {(Object.entries(TP_DER_LABELS) as [TpDer, string][]).map(([k, v]) => (
              <option key={k} value={k}>{k} — {v}</option>
            ))}
          </select>

          <Input
            placeholder="Filtrar por sucursal..."
            value={sucursal}
            onChange={(e) => { setSucursal(e.target.value); handleFilterChange(); }}
          />
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
        onDelete={setDeleting}
      />

      {/* ── Modal formulario ──────────────────────────────────────────── */}
      <ContratoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {/* ── Diálogo confirmación eliminación ──────────────────────────── */}
      <AlertDialog open={deleting !== null} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar contrato</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `¿Confirmás que querés eliminar el contrato ${deleting.numContrato} de ${deleting.nombre}? Esta acción no se puede deshacer.`
                : "Confirma la eliminación del contrato."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default ContratosPage;
