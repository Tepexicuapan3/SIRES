import { useState } from "react";
import { toast } from "sonner";
import { Package, Plus, RotateCcw } from "lucide-react";
import { useDebounce } from "@shared/hooks/useDebounce";
import { DataTable } from "@features/admin/shared/components/DataTable";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { TableOptionsMenu, type TableOptionItem } from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { TableFilterMenu } from "@features/admin/shared/components/TableFilterMenu";
import { TableColumnVisibility, type ColumnVisibilityState } from "@features/admin/shared/components/TableColumnVisibility";
import { ConfirmDestructiveDialog } from "@features/admin/shared/components/ConfirmDestructiveDialog";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import type { CatInsumo } from "@api/types";
import { useInsumosList } from "../queries/useCatalogosQueries";
import { useUpdateInsumo, useDeleteInsumo } from "../mutations/useCatalogosMutations";
import { getCatalogErrorMessage } from "../utils/catalogos.feedback";
import { InsumoCreateDialog } from "../components/InsumoCreateDialog";
import { InsumoEditDialog } from "../components/InsumoEditDialog";
import { buildInsumoTableColumns, buildInsumoVisibilityOptions } from "../components/InsumoTableColumns";

const STATUS_FILTER = { ALL: "all", ACTIVE: "active", INACTIVE: "inactive" } as const;
type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function InsumosPage() {
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(20);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER.ALL);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    codigo: true, nombre: true, categoriaLabel: true, unidadLabel: true,
    codigoBarras: true, flags: true, isActive: true, actions: true,
  });
  const [createOpen, setCreateOpen]     = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [itemToEdit, setItemToEdit]     = useState<CatInsumo | null>(null);
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatInsumo | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const updateInsumo    = useUpdateInsumo();
  const deleteInsumo    = useDeleteInsumo();

  const { data, isLoading, isFetching, error, refetch } = useInsumosList({
    page, pageSize,
    search: debouncedSearch.trim() || undefined,
    includeInactive: statusFilter !== STATUS_FILTER.ACTIVE,
  });

  const allRows = data?.items ?? [];
  const rows = statusFilter === STATUS_FILTER.INACTIVE
    ? allRows.filter((r) => !r.isActive)
    : allRows;

  const handleOpenEdit = (item: CatInsumo) => { setItemToEdit(item); setEditOpen(true); };

  const handleToggleStatus = async (item: CatInsumo) => {
    try {
      await updateInsumo.mutateAsync({ id: item.id, data: { isActive: !item.isActive } });
      toast.success(item.isActive ? "Insumo desactivado" : "Insumo activado");
    } catch (err) {
      toast.error("No se pudo actualizar el estado", { description: getCatalogErrorMessage(err, "Intenta nuevamente") });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteInsumo.mutateAsync(itemToDelete.id);
      toast.success("Insumo eliminado");
      setDeleteOpen(false); setItemToDelete(null);
    } catch (err) {
      toast.error("No se pudo eliminar", { description: getCatalogErrorMessage(err, "Error al eliminar") });
    }
  };

  const handleClearFilters = () => { setSearch(""); setStatusFilter(STATUS_FILTER.ALL); setPage(1); };

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(Boolean).length;
  const isSearchPending     = search.trim() !== debouncedSearch.trim();

  const columns = buildInsumoTableColumns({
    isStatusPending: updateInsumo.isPending,
    onOpenEdit: handleOpenEdit,
    onToggleStatus: (item) => { void handleToggleStatus(item); },
    onRequestDelete: (item) => { setItemToDelete(item); setDeleteOpen(true); },
  });

  const visibilityOptions = buildInsumoVisibilityOptions();
  const visibleColumns    = columns.filter((col) => columnVisibility[col.key] ?? true);

  const tableOptions: TableOptionItem[] = [
    { id: "refresh", label: "Actualizar", icon: RotateCcw,
      isLoading: isFetching, disabled: isFetching,
      onSelect: () => { if (!isFetching) void refetch(); },
    },
  ];

  const filterSections = [
    {
      id: "status", label: "Estado",
      options: [
        { id: STATUS_FILTER.ACTIVE, label: "Activos", selected: statusFilter === STATUS_FILTER.ACTIVE,
          onSelect: () => { setStatusFilter(STATUS_FILTER.ACTIVE); setPage(1); } },
        { id: STATUS_FILTER.INACTIVE, label: "Inactivos", selected: statusFilter === STATUS_FILTER.INACTIVE,
          onSelect: () => { setStatusFilter(STATUS_FILTER.INACTIVE); setPage(1); } },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Catálogo de Insumos"
      description="Gestión de insumos médicos con código de barras, unidad y categoría."
      icon={<Package className="size-12" />}
    >
      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Buscar por nombre, código o código de barras"
          />
        }
        actions={
          <>
            <TableFilterMenu sections={filterSections} appliedCount={appliedFiltersCount} onClear={handleClearFilters} />
            <TableColumnVisibility columns={visibilityOptions} visibility={columnVisibility} onVisibilityChange={setColumnVisibility} />
            <TableOptionsMenu options={tableOptions} />
            <TablePrimaryAction
              permission="almacen:insumos:create"
              label="Nuevo insumo"
              icon={<Plus className="size-4" />}
              onClick={() => setCreateOpen(true)}
            />
          </>
        }
      />

      <DataTable
        columns={visibleColumns}
        rows={rows}
        isLoading={isLoading || isSearchPending}
        isError={Boolean(error)}
        errorTitle="No se pudo cargar el catálogo de insumos"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0}
        onRowClick={handleOpenEdit}
        onRetry={() => { void refetch(); }}
        onClearFilters={handleClearFilters}
        pagination={{
          page, pageSize,
          total: data?.total ?? 0,
          totalPages: data?.totalPages ?? 1,
          onPageChange: setPage,
          onPageSizeChange: (v) => { setPageSize(v); setPage(1); },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin insumos registrados"
        emptyDescription="Agrega los insumos médicos que maneja la clínica."
      />

      <InsumoCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <InsumoEditDialog
        open={editOpen}
        onOpenChange={(v) => { setEditOpen(v); if (!v) setItemToEdit(null); }}
        item={itemToEdit}
      />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(v) => { setDeleteOpen(v); if (!v) setItemToDelete(null); }}
        title="Eliminar insumo"
        description={`Se eliminará "${itemToDelete?.nombre}". Esta acción no se puede deshacer.`}
        onConfirm={() => { void handleDelete(); }}
        confirmDisabled={deleteInsumo.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default InsumosPage;
