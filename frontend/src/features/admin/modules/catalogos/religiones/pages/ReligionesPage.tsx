import { useState } from "react";
import { toast } from "sonner";
import { Landmark, Download, Plus, RotateCcw } from "lucide-react";
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
import { useDeleteReligion } from "@features/admin/modules/catalogos/religiones/mutations/useDeleteReligion";
import { useUpdateReligion } from "@features/admin/modules/catalogos/religiones/mutations/useUpdateReligion";
import { useReligionesList } from "@features/admin/modules/catalogos/religiones/queries/useReligionesList";
import {
  buildReligionesTableColumns,
  buildReligionesVisibilityOptions,
} from "@features/admin/modules/catalogos/religiones/components/ReligionesTableColumns";
import { ReligionCreateDialog } from "@features/admin/modules/catalogos/religiones/components/ReligionCreateDialog";
import { ReligionDetailsDialog } from "@features/admin/modules/catalogos/religiones/components/ReligionDetailsDialog";
import { getReligionErrorMessage } from "@features/admin/modules/catalogos/religiones/utils/religiones.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { ReligionListItem } from "@api/types";

const RELIGION_STATUS_FILTER = { ALL: "all", ACTIVE: "active", INACTIVE: "inactive" } as const;
type ReligionStatusFilter = (typeof RELIGION_STATUS_FILTER)[keyof typeof RELIGION_STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) => String(value ?? "").toLowerCase();

export function ReligionesPage() {
  const { hasCapability } = usePermissionDependencies();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReligionStatusFilter>(RELIGION_STATUS_FILTER.ALL);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    name: true, isActive: true, actions: true,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [religionToDelete, setReligionToDelete] = useState<ReligionListItem | null>(null);

  const {
    open: detailsOpen, selectedItem: selectedReligion, openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails, setOpen: setDetailsOpen,
  } = useTableDetailsDialog<ReligionListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateReligion = useUpdateReligion();
  const deleteReligion = useDeleteReligion();

  const canReadReligion = hasCapability("admin.catalogs.religiones.read", { allOf: ["admin:catalogos:religion:read"] });
  const canCreateReligion = hasCapability("admin.catalogs.religiones.create", { allOf: ["admin:catalogos:religion:create"] });
  const canUpdateReligion = hasCapability("admin.catalogs.religiones.update", { allOf: ["admin:catalogos:religion:update"] });
  const canDeleteReligion = hasCapability("admin.catalogs.religiones.delete", { allOf: ["admin:catalogos:religion:delete"] });
  const readOnlyCatalogMessage = "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } = useReligionesList(
    {
      page, pageSize,
      isActive: statusFilter === RELIGION_STATUS_FILTER.ALL ? undefined : statusFilter === RELIGION_STATUS_FILTER.ACTIVE,
    },
    { enabled: canReadReligion },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows = normalizedSearch.length === 0
    ? allRows
    : allRows.filter((religion) => normalizeSearchValue(religion.name).includes(normalizedSearch));

  const showActions = canReadReligion || canUpdateReligion || canDeleteReligion;
  const isStatusPending = updateReligion.isPending;

  const handleToggleStatus = async (religion: ReligionListItem) => {
    const nextStatus = !religion.isActive;
    try {
      await updateReligion.mutateAsync({ id: religion.id, data: { isActive: nextStatus } });
      toast.success(nextStatus ? "Religion activada" : "Religion desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", { description: getReligionErrorMessage(mutationError, "Error al actualizar estado") });
    }
  };

  const handleDeleteReligion = async () => {
    if (!religionToDelete) return;
    try {
      await deleteReligion.mutateAsync({ id: religionToDelete.id });
      toast.success("Religion eliminada", { description: `La religion ${religionToDelete.name} se elimino correctamente.` });
      setDeleteOpen(false);
      setReligionToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", { description: getReligionErrorMessage(mutationError, "Error al eliminar religion") });
    }
  };

  const columns = buildReligionesTableColumns({
    canReadReligion, canUpdateReligion, canDeleteReligion, isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (religion) => { void handleToggleStatus(religion); },
    onRequestDelete: (religion) => { setReligionToDelete(religion); setDeleteOpen(true); },
  });
  const visibilityOptions = buildReligionesVisibilityOptions(showActions);
  const visibleColumns = columns.filter((column) => columnVisibility[column.key] ?? true);

  const appliedFiltersCount = [statusFilter !== RELIGION_STATUS_FILTER.ALL].filter(Boolean).length;
  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters = canReadReligion && (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription = canReadReligion && error
    ? getReligionErrorMessage(error, "No se pudo obtener el listado de religiones. Intenta nuevamente.")
    : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(RELIGION_STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    { id: "refresh-religiones", label: "Actualizar", icon: RotateCcw, isLoading: isFetching, disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); } },
    { id: "export-religiones", label: "Exportar", icon: Download, loadingAnimation: "pulse" },
  ];

  const filterSections = [{
    id: "status", label: "Estado",
    options: [
      { id: RELIGION_STATUS_FILTER.ACTIVE, label: "Activos", selected: statusFilter === RELIGION_STATUS_FILTER.ACTIVE, onSelect: () => { setStatusFilter(RELIGION_STATUS_FILTER.ACTIVE); setPage(1); } },
      { id: RELIGION_STATUS_FILTER.INACTIVE, label: "Inactivos", selected: statusFilter === RELIGION_STATUS_FILTER.INACTIVE, onSelect: () => { setStatusFilter(RELIGION_STATUS_FILTER.INACTIVE); setPage(1); } },
    ],
  }];

  return (
    <CatalogModuleLayout title="Religiones" description="Catalogo de religiones del paciente." icon={<Landmark className="size-12" />}>
      {!canReadReligion ? <AdminReadOnlyNotice message={readOnlyCatalogMessage} /> : null}

      <TableHeaderBar
        search={<TableSearch value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Buscar en la tabla" disabled={!canReadReligion} />}
        actions={
          <>
            {canReadReligion ? <TableFilterMenu sections={filterSections} appliedCount={appliedFiltersCount} onClear={handleClearFilters} /> : null}
            {canReadReligion ? <TableColumnVisibility columns={visibilityOptions} visibility={columnVisibility} onVisibilityChange={setColumnVisibility} /> : null}
            {canReadReligion ? <TableOptionsMenu options={tableOptions} /> : null}
            {canCreateReligion ? (
              <TablePrimaryAction permission="admin:catalogos:religion:create" dependencyAware label="Nuevo" icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)} />
            ) : null}
          </>
        }
      />

      <DataTable
        columns={visibleColumns}
        rows={rows}
        isLoading={isLoading || isSearchPending}
        isError={canReadReligion && Boolean(error)}
        errorTitle="No se pudo cargar religiones"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadReligion ? handleOpenDetails : undefined}
        onRetry={() => { void refetch(); }}
        onClearFilters={handleClearFilters}
        pagination={{
          page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage,
          onPageSizeChange: (value) => { setPageSize(value); setPage(1); },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin religiones"
        emptyDescription="Cuando existan religiones registradas se listaran aqui."
      />

      <ReligionDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} onClose={handleCloseDetails} religionSummary={selectedReligion} canEdit={canUpdateReligion} />
      <ReligionCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => { setDeleteOpen(nextOpen); if (!nextOpen) setReligionToDelete(null); }}
        title="Eliminar religion"
        description="Esta accion dara de baja la religion y la quitara del catalogo."
        onConfirm={() => { void handleDeleteReligion(); }}
        confirmDisabled={deleteReligion.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default ReligionesPage;
