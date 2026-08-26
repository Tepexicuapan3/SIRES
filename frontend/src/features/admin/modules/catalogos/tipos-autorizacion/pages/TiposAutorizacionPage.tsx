import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, ShieldCheck } from "lucide-react";
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
import { TipoAutorizacionCreateDialog } from "@features/admin/modules/catalogos/tipos-autorizacion/components/TipoAutorizacionCreateDialog";
import { TipoAutorizacionDetailsDialog } from "@features/admin/modules/catalogos/tipos-autorizacion/components/TipoAutorizacionDetailsDialog";
import {
  buildTiposAutorizacionTableColumns,
  buildTiposAutorizacionVisibilityOptions,
} from "@features/admin/modules/catalogos/tipos-autorizacion/components/TiposAutorizacionTableColumns";
import { useDeleteTipoAutorizacion } from "@features/admin/modules/catalogos/tipos-autorizacion/mutations/useDeleteTipoAutorizacion";
import { useUpdateTipoAutorizacion } from "@features/admin/modules/catalogos/tipos-autorizacion/mutations/useUpdateTipoAutorizacion";
import { useTiposAutorizacionList } from "@features/admin/modules/catalogos/tipos-autorizacion/queries/useTiposAutorizacionList";
import { getTipoAutorizacionErrorMessage } from "@features/admin/modules/catalogos/tipos-autorizacion/utils/tipos-autorizacion.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { TipoAutorizacionListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function TiposAutorizacionPage() {
  const { hasCapability } = usePermissionDependencies();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    STATUS_FILTER.ALL,
  );

  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      name: true,
      code: true,
      isActive: true,
      actions: true,
    });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<TipoAutorizacionListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<TipoAutorizacionListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateTipoAutorizacion = useUpdateTipoAutorizacion();
  const deleteTipoAutorizacion = useDeleteTipoAutorizacion();

  const canRead = hasCapability("admin.catalogs.tiposAutorizacion.read", {
    allOf: ["admin:catalogos:tp_autorizacion:read"],
  });
  const canCreate = hasCapability("admin.catalogs.tiposAutorizacion.create", {
    allOf: ["admin:catalogos:tp_autorizacion:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.tiposAutorizacion.update", {
    allOf: ["admin:catalogos:tp_autorizacion:update"],
  });
  const canDelete = hasCapability("admin.catalogs.tiposAutorizacion.delete", {
    allOf: ["admin:catalogos:tp_autorizacion:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useTiposAutorizacionList(
    {
      page,
      pageSize,
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
      : allRows.filter((item) => {
          const matchesName = normalizeSearchValue(item.name).includes(
            normalizedSearch,
          );
          const matchesCode = normalizeSearchValue(item.code).includes(
            normalizedSearch,
          );
          return matchesName || matchesCode;
        });

  const showActions = canRead || canUpdate || canDelete;
  const isStatusPending = updateTipoAutorizacion.isPending;

  const handleToggleStatus = async (item: TipoAutorizacionListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateTipoAutorizacion.mutateAsync({
        id: item.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Tipo de autorizacion activado" : "Tipo de autorizacion desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoAutorizacionErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteTipoAutorizacion.mutateAsync({ id: itemToDelete.id });

      toast.success("Tipo de autorizacion eliminado", {
        description: `El tipo ${itemToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getTipoAutorizacionErrorMessage(
          mutationError,
          "Error al eliminar tipo de autorizacion",
        ),
      });
    }
  };

  const columns = buildTiposAutorizacionTableColumns({
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

  const visibilityOptions = buildTiposAutorizacionVisibilityOptions(showActions);

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
      ? getTipoAutorizacionErrorMessage(
          error,
          "No se pudo obtener el listado de tipos de autorizacion. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-tipos-autorizacion",
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
      id: "export-tipos-autorizacion",
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
      title="Tipos de autorizacion"
      description="Catalogo de tipos de autorizacion medica."
      icon={<ShieldCheck className="size-12" />}
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
            placeholder="Buscar por nombre o codigo"
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
                permission="admin:catalogos:tp_autorizacion:create"
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
        errorTitle="No se pudo cargar tipos de autorizacion"
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
        emptyTitle="Sin tipos de autorizacion"
        emptyDescription="Cuando existan tipos de autorizacion registrados se listaran aqui."
      />

      <TipoAutorizacionDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        tipoAutorizacionSummary={selectedItem}
        canEdit={canUpdate}
      />

      <TipoAutorizacionCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar tipo de autorizacion"
        description="Esta accion dara de baja el tipo de autorizacion y lo quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteTipoAutorizacion.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default TiposAutorizacionPage;
