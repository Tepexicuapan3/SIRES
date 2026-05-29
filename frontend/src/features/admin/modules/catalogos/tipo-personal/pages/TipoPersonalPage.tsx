import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, Download, Plus, RotateCcw } from "lucide-react";
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
import { TipoPersonalCreateDialog } from "@features/admin/modules/catalogos/tipo-personal/components/TipoPersonalCreateDialog";
import { TipoPersonalDetailsDialog } from "@features/admin/modules/catalogos/tipo-personal/components/TipoPersonalDetailsDialog";
import {
  buildTipoPersonalTableColumns,
  buildTipoPersonalVisibilityOptions,
} from "@features/admin/modules/catalogos/tipo-personal/components/TipoPersonalTableColumns";
import { useDeleteTipoPersonal } from "@features/admin/modules/catalogos/tipo-personal/mutations/useDeleteTipoPersonal";
import { useUpdateTipoPersonal } from "@features/admin/modules/catalogos/tipo-personal/mutations/useUpdateTipoPersonal";
import { useTipoPersonalList } from "@features/admin/modules/catalogos/tipo-personal/queries/useTipoPersonalList";
import { getTipoPersonalErrorMessage } from "@features/admin/modules/catalogos/tipo-personal/utils/tipo-personal.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { TipoPersonalListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function TipoPersonalPage() {
  const { hasCapability } = usePermissionDependencies();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER.ALL);

  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({ name: true, isActive: true, actions: true });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TipoPersonalListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<TipoPersonalListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateTipoPersonal = useUpdateTipoPersonal();
  const deleteTipoPersonal = useDeleteTipoPersonal();

  const canRead = hasCapability("admin.catalogs.tipo-personal.read", {
    allOf: ["admin:catalogos:tipo_personal:read"],
  });
  const canCreate = hasCapability("admin.catalogs.tipo-personal.create", {
    allOf: ["admin:catalogos:tipo_personal:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.tipo-personal.update", {
    allOf: ["admin:catalogos:tipo_personal:update"],
  });
  const canDelete = hasCapability("admin.catalogs.tipo-personal.delete", {
    allOf: ["admin:catalogos:tipo_personal:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useTipoPersonalList(
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
  const isStatusPending = updateTipoPersonal.isPending;

  const handleToggleStatus = async (item: TipoPersonalListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateTipoPersonal.mutateAsync({
        id: item.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Tipo de personal activado" : "Tipo de personal desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoPersonalErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteTipoPersonal.mutateAsync({ id: itemToDelete.id });

      toast.success("Tipo de personal eliminado", {
        description: `El tipo ${itemToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getTipoPersonalErrorMessage(
          mutationError,
          "Error al eliminar tipo de personal",
        ),
      });
    }
  };

  const columns = buildTipoPersonalTableColumns({
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

  const visibilityOptions = buildTipoPersonalVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();

  const hasFilters =
    canRead && (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);

  const tableErrorDescription =
    canRead && error
      ? getTipoPersonalErrorMessage(
          error,
          "No se pudo obtener el listado de tipos de personal. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-tipo-personal",
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
      id: "export-tipo-personal",
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
      title="Tipos de personal"
      description="Catalogo de tipos de personal del sistema."
      icon={<Briefcase className="size-12" />}
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
                permission="admin:catalogos:tipo_personal:create"
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
        errorTitle="No se pudo cargar tipos de personal"
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
        emptyTitle="Sin tipos de personal"
        emptyDescription="Cuando existan tipos de personal registrados se listaran aqui."
      />

      <TipoPersonalDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        tipoPersonalSummary={selectedItem}
        canEdit={canUpdate}
      />

      <TipoPersonalCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar tipo de personal"
        description="Esta accion dara de baja el tipo de personal y lo quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteTipoPersonal.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default TipoPersonalPage;
