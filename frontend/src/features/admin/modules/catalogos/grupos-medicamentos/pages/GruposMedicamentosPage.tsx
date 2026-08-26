import { useState } from "react";
import { toast } from "sonner";
import { Download, Pill, Plus, RotateCcw } from "lucide-react";
import { useDebounce } from "@shared/hooks/useDebounce";
import { DataTable } from "@features/admin/shared/components/DataTable";
import {
  TableColumnVisibility,
  type ColumnVisibilityState,
} from "@features/admin/shared/components/TableColumnVisibility";
import { TableFilterMenu } from "@features/admin/shared/components/TableFilterMenu";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import {
  TableOptionsMenu,
  type TableOptionItem,
} from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { ConfirmDestructiveDialog } from "@features/admin/shared/components/ConfirmDestructiveDialog";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { useTableDetailsDialog } from "@features/admin/shared/hooks/useTableDetailsDialog";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { GrupoMedicamentosCreateDialog } from "@features/admin/modules/catalogos/grupos-medicamentos/components/GrupoMedicamentosCreateDialog";
import { GrupoMedicamentosDetailsDialog } from "@features/admin/modules/catalogos/grupos-medicamentos/components/GrupoMedicamentosDetailsDialog";
import {
  buildGruposMedicamentosTableColumns,
  buildGruposMedicamentosVisibilityOptions,
} from "@features/admin/modules/catalogos/grupos-medicamentos/components/GruposMedicamentosTableColumns";
import { useDeleteGrupoMedicamentos } from "@features/admin/modules/catalogos/grupos-medicamentos/mutations/useDeleteGrupoMedicamentos";
import { useUpdateGrupoMedicamentos } from "@features/admin/modules/catalogos/grupos-medicamentos/mutations/useUpdateGrupoMedicamentos";
import { useGruposMedicamentosList } from "@features/admin/modules/catalogos/grupos-medicamentos/queries/useGruposMedicamentosList";
import { getGrupoMedicamentosErrorMessage } from "@features/admin/modules/catalogos/grupos-medicamentos/utils/grupos-medicamentos.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { GrupoMedicamentosListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function GruposMedicamentosPage() {
  const { hasCapability } = usePermissionDependencies();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    STATUS_FILTER.ALL,
  );

  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({ name: true, isActive: true, actions: true });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GrupoMedicamentosListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<GrupoMedicamentosListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateGrupoMedicamentos = useUpdateGrupoMedicamentos();
  const deleteGrupoMedicamentos = useDeleteGrupoMedicamentos();

  const canRead = hasCapability("admin.catalogs.gruposMedicamentos.read", {
    allOf: ["admin:catalogos:grupos_medicamentos:read"],
  });
  const canCreate = hasCapability("admin.catalogs.gruposMedicamentos.create", {
    allOf: ["admin:catalogos:grupos_medicamentos:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.gruposMedicamentos.update", {
    allOf: ["admin:catalogos:grupos_medicamentos:update"],
  });
  const canDelete = hasCapability("admin.catalogs.gruposMedicamentos.delete", {
    allOf: ["admin:catalogos:grupos_medicamentos:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useGruposMedicamentosList(
    {
      page,
      pageSize,
      search: debouncedSearch.trim() || undefined,
      isActive:
        statusFilter === STATUS_FILTER.ALL
          ? undefined
          : statusFilter === STATUS_FILTER.ACTIVE,
    },
    { enabled: canRead },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();

  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((item) =>
          item.name.toLowerCase().includes(normalizedSearch),
        );

  const showActions = canRead || canUpdate || canDelete;
  const isStatusPending = updateGrupoMedicamentos.isPending;

  const handleToggleStatus = async (item: GrupoMedicamentosListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateGrupoMedicamentos.mutateAsync({
        id: item.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Grupo de medicamentos activado" : "Grupo de medicamentos desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getGrupoMedicamentosErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteGrupoMedicamentos.mutateAsync({ id: itemToDelete.id });

      toast.success("Grupo de medicamentos eliminado", {
        description: `El grupo ${itemToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getGrupoMedicamentosErrorMessage(
          mutationError,
          "Error al eliminar grupo de medicamentos",
        ),
      });
    }
  };

  const columns = buildGruposMedicamentosTableColumns({
    canRead,
    canUpdate,
    canDelete,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (item) => {
      void handleToggleStatus(item);
    },
    onRequestDelete: (item) => {
      setItemToDelete(item);
      setDeleteOpen(true);
    },
  });

  const visibilityOptions = buildGruposMedicamentosVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(
    Boolean,
  ).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();

  const hasFilters =
    canRead && (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);

  const tableErrorDescription =
    canRead && error
      ? getGrupoMedicamentosErrorMessage(
          error,
          "No se pudo obtener el listado de grupos de medicamentos. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-grupos-medicamentos",
      label: "Actualizar",
      icon: RotateCcw,
      isLoading: isFetching,
      disabled: isFetching,
      onSelect: () => {
        if (isFetching) return;
        void refetch();
      },
    },
    {
      id: "export-grupos-medicamentos",
      label: "Exportar",
      icon: Download,
      loadingAnimation: "pulse",
    },
  ];

  const filterSections = [
    {
      id: "status",
      label: "Estado",
      options: [
        {
          id: STATUS_FILTER.ACTIVE,
          label: "Activos",
          selected: statusFilter === STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: STATUS_FILTER.INACTIVE,
          label: "Inactivos",
          selected: statusFilter === STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Grupos de medicamentos"
      description="Catalogo de agrupaciones de medicamentos."
      icon={<Pill className="size-12" />}
    >
      {!canRead ? (
        <AdminReadOnlyNotice message="No tienes acceso para consultar este catalogo." />
      ) : null}

      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Buscar por nombre"
            disabled={!canRead}
          />
        }
        actions={
          <>
            {canRead ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}

            {canRead ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}

            {canRead ? <TableOptionsMenu options={tableOptions} /> : null}

            {canCreate ? (
              <TablePrimaryAction
                permission="admin:catalogos:grupos_medicamentos:create"
                dependencyAware
                label="Nuevo"
                icon={<Plus className="size-4" />}
                onClick={() => setCreateOpen(true)}
              />
            ) : null}
          </>
        }
      />

      <DataTable
        columns={visibleColumns}
        rows={rows}
        isLoading={isLoading || isSearchPending}
        isError={canRead && Boolean(error)}
        errorTitle="No se pudo cargar grupos de medicamentos"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canRead ? handleOpenDetails : undefined}
        onRetry={() => {
          void refetch();
        }}
        onClearFilters={handleClearFilters}
        pagination={{
          page,
          pageSize,
          total: data?.total ?? 0,
          totalPages: data?.totalPages ?? 1,
          onPageChange: setPage,
          onPageSizeChange: (value) => {
            setPageSize(value);
            setPage(1);
          },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin grupos de medicamentos"
        emptyDescription="Cuando existan grupos de medicamentos registrados se listaran aqui."
      />

      <GrupoMedicamentosDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        grupoMedicamentosSummary={selectedItem}
        canEdit={canUpdate}
      />

      <GrupoMedicamentosCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar grupo de medicamentos"
        description="Esta accion dara de baja el grupo de medicamentos y lo quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteGrupoMedicamentos.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default GruposMedicamentosPage;
