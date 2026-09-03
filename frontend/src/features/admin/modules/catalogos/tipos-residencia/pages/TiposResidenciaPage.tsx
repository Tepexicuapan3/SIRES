import { useState } from "react";
import { toast } from "sonner";
import { Home, Download, Plus, RotateCcw } from "lucide-react";
import { useDebounce } from "@shared/hooks/useDebounce";
import { DataTable } from "@features/admin/shared/components/DataTable";
import { TableColumnVisibility, type ColumnVisibilityState } from "@features/admin/shared/components/TableColumnVisibility";
import { TableFilterMenu } from "@features/admin/shared/components/TableFilterMenu";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableOptionsMenu, type TableOptionItem } from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { ConfirmDestructiveDialog } from "@features/admin/shared/components/ConfirmDestructiveDialog";
import { useTableDetailsDialog } from "@features/admin/shared/hooks/useTableDetailsDialog";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { useDeleteTipoResidencia } from "@features/admin/modules/catalogos/tipos-residencia/mutations/useDeleteTipoResidencia";
import { useUpdateTipoResidencia } from "@features/admin/modules/catalogos/tipos-residencia/mutations/useUpdateTipoResidencia";
import { useTiposResidenciaList } from "@features/admin/modules/catalogos/tipos-residencia/queries/useTiposResidenciaList";
import {
  buildTiposResidenciaTableColumns,
  buildTiposResidenciaVisibilityOptions,
} from "@features/admin/modules/catalogos/tipos-residencia/components/TiposResidenciaTableColumns";
import { TipoResidenciaCreateDialog } from "@features/admin/modules/catalogos/tipos-residencia/components/TipoResidenciaCreateDialog";
import { TipoResidenciaDetailsDialog } from "@features/admin/modules/catalogos/tipos-residencia/components/TipoResidenciaDetailsDialog";
import { getTipoResidenciaErrorMessage } from "@features/admin/modules/catalogos/tipos-residencia/utils/tipos-residencia.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { TipoResidenciaListItem } from "@api/types";

const TIPO_RESIDENCIA_STATUS_FILTER = { ALL: "all", ACTIVE: "active", INACTIVE: "inactive" } as const;
type TipoResidenciaStatusFilter = (typeof TIPO_RESIDENCIA_STATUS_FILTER)[keyof typeof TIPO_RESIDENCIA_STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) => String(value ?? "").toLowerCase();

export function TiposResidenciaPage() {
  const { hasCapability } = usePermissionDependencies();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TipoResidenciaStatusFilter>(TIPO_RESIDENCIA_STATUS_FILTER.ALL);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    name: true, isActive: true, actions: true,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tipoResidenciaToDelete, setTipoResidenciaToDelete] = useState<TipoResidenciaListItem | null>(null);

  const {
    open: detailsOpen, selectedItem: selectedTipoResidencia, openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails, setOpen: setDetailsOpen,
  } = useTableDetailsDialog<TipoResidenciaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateTipoResidencia = useUpdateTipoResidencia();
  const deleteTipoResidencia = useDeleteTipoResidencia();

  const canReadTipoResidencia = hasCapability("admin.catalogs.tipos-residencia.read", { allOf: ["admin:catalogos:tipo_residencia:read"] });
  const canCreateTipoResidencia = hasCapability("admin.catalogs.tipos-residencia.create", { allOf: ["admin:catalogos:tipo_residencia:create"] });
  const canUpdateTipoResidencia = hasCapability("admin.catalogs.tipos-residencia.update", { allOf: ["admin:catalogos:tipo_residencia:update"] });
  const canDeleteTipoResidencia = hasCapability("admin.catalogs.tipos-residencia.delete", { allOf: ["admin:catalogos:tipo_residencia:delete"] });
  const readOnlyCatalogMessage = "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } = useTiposResidenciaList(
    {
      page, pageSize,
      isActive: statusFilter === TIPO_RESIDENCIA_STATUS_FILTER.ALL ? undefined : statusFilter === TIPO_RESIDENCIA_STATUS_FILTER.ACTIVE,
    },
    { enabled: canReadTipoResidencia },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows = normalizedSearch.length === 0
    ? allRows
    : allRows.filter((tipoResidencia) => normalizeSearchValue(tipoResidencia.name).includes(normalizedSearch));

  const showActions = canReadTipoResidencia || canUpdateTipoResidencia || canDeleteTipoResidencia;
  const isStatusPending = updateTipoResidencia.isPending;

  const handleToggleStatus = async (tipoResidencia: TipoResidenciaListItem) => {
    const nextStatus = !tipoResidencia.isActive;
    try {
      await updateTipoResidencia.mutateAsync({ id: tipoResidencia.id, data: { isActive: nextStatus } });
      toast.success(nextStatus ? "Tipo de residencia activado" : "Tipo de residencia desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", { description: getTipoResidenciaErrorMessage(mutationError, "Error al actualizar estado") });
    }
  };

  const handleDeleteTipoResidencia = async () => {
    if (!tipoResidenciaToDelete) return;
    try {
      await deleteTipoResidencia.mutateAsync({ id: tipoResidenciaToDelete.id });
      toast.success("Tipo de residencia eliminado", { description: `El tipo de residencia ${tipoResidenciaToDelete.name} se elimino correctamente.` });
      setDeleteOpen(false);
      setTipoResidenciaToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", { description: getTipoResidenciaErrorMessage(mutationError, "Error al eliminar tipo de residencia") });
    }
  };

  const columns = buildTiposResidenciaTableColumns({
    canReadTipoResidencia, canUpdateTipoResidencia, canDeleteTipoResidencia, isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (tipoResidencia) => { void handleToggleStatus(tipoResidencia); },
    onRequestDelete: (tipoResidencia) => { setTipoResidenciaToDelete(tipoResidencia); setDeleteOpen(true); },
  });
  const visibilityOptions = buildTiposResidenciaVisibilityOptions(showActions);
  const visibleColumns = columns.filter((column) => columnVisibility[column.key] ?? true);

  const appliedFiltersCount = [statusFilter !== TIPO_RESIDENCIA_STATUS_FILTER.ALL].filter(Boolean).length;
  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters = canReadTipoResidencia && (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription = canReadTipoResidencia && error
    ? getTipoResidenciaErrorMessage(error, "No se pudo obtener el listado de tipos de residencia. Intenta nuevamente.")
    : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(TIPO_RESIDENCIA_STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    { id: "refresh-tipos-residencia", label: "Actualizar", icon: RotateCcw, isLoading: isFetching, disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); } },
    { id: "export-tipos-residencia", label: "Exportar", icon: Download, loadingAnimation: "pulse" },
  ];

  const filterSections = [{
    id: "status", label: "Estado",
    options: [
      { id: TIPO_RESIDENCIA_STATUS_FILTER.ACTIVE, label: "Activos", selected: statusFilter === TIPO_RESIDENCIA_STATUS_FILTER.ACTIVE, onSelect: () => { setStatusFilter(TIPO_RESIDENCIA_STATUS_FILTER.ACTIVE); setPage(1); } },
      { id: TIPO_RESIDENCIA_STATUS_FILTER.INACTIVE, label: "Inactivos", selected: statusFilter === TIPO_RESIDENCIA_STATUS_FILTER.INACTIVE, onSelect: () => { setStatusFilter(TIPO_RESIDENCIA_STATUS_FILTER.INACTIVE); setPage(1); } },
    ],
  }];

  return (
    <CatalogModuleLayout title="Tipos de residencia" description="Catalogo de tipos de residencia del paciente." icon={<Home className="size-12" />}>
      {!canReadTipoResidencia ? <AdminReadOnlyNotice message={readOnlyCatalogMessage} /> : null}

      <TableHeaderBar
        search={<TableSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Buscar en la tabla" disabled={!canReadTipoResidencia} />}
        actions={
          <>
            {canReadTipoResidencia ? <TableFilterMenu sections={filterSections} appliedCount={appliedFiltersCount} onClear={handleClearFilters} /> : null}
            {canReadTipoResidencia ? <TableColumnVisibility columns={visibilityOptions} visibility={columnVisibility} onVisibilityChange={setColumnVisibility} /> : null}
            {canReadTipoResidencia ? <TableOptionsMenu options={tableOptions} /> : null}
            {canCreateTipoResidencia ? (
              <TablePrimaryAction permission="admin:catalogos:tipo_residencia:create" dependencyAware label="Nuevo" icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)} />
            ) : null}
          </>
        }
      />

      <DataTable
        columns={visibleColumns}
        rows={rows}
        isLoading={isLoading || isSearchPending}
        isError={canReadTipoResidencia && Boolean(error)}
        errorTitle="No se pudo cargar tipos de residencia"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadTipoResidencia ? handleOpenDetails : undefined}
        onRetry={() => { void refetch(); }}
        onClearFilters={handleClearFilters}
        pagination={{
          page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage,
          onPageSizeChange: (value) => { setPageSize(value); setPage(1); },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin tipos de residencia"
        emptyDescription="Cuando existan tipos de residencia registrados se listaran aqui."
      />

      <TipoResidenciaDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} onClose={handleCloseDetails} tipoResidenciaSummary={selectedTipoResidencia} canEdit={canUpdateTipoResidencia} />
      <TipoResidenciaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => { setDeleteOpen(nextOpen); if (!nextOpen) setTipoResidenciaToDelete(null); }}
        title="Eliminar tipo de residencia"
        description="Esta accion dara de baja el tipo de residencia y lo quitara del catalogo."
        onConfirm={() => { void handleDeleteTipoResidencia(); }}
        confirmDisabled={deleteTipoResidencia.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default TiposResidenciaPage;
