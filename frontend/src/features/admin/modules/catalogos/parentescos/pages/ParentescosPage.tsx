import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, Users } from "lucide-react";
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
import { ParentescoCreateDialog } from "@features/admin/modules/catalogos/parentescos/components/ParentescoCreateDialog";
import { ParentescoDetailsDialog } from "@features/admin/modules/catalogos/parentescos/components/ParentescoDetailsDialog";
import {
  buildParentescosTableColumns,
  buildParentescosVisibilityOptions,
} from "@features/admin/modules/catalogos/parentescos/components/ParentescosTableColumns";
import { useDeleteParentesco } from "@features/admin/modules/catalogos/parentescos/mutations/useDeleteParentesco";
import { useUpdateParentesco } from "@features/admin/modules/catalogos/parentescos/mutations/useUpdateParentesco";
import { useParentescoList } from "@features/admin/modules/catalogos/parentescos/queries/useParentescoList";
import { getParentescoErrorMessage } from "@features/admin/modules/catalogos/parentescos/utils/parentesco.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { ParentescoListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function ParentescosPage() {
  const { hasCapability } = usePermissionDependencies();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    STATUS_FILTER.ALL,
  );

  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({ id: true, name: true, isActive: true, actions: true });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ParentescoListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<ParentescoListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateParentesco = useUpdateParentesco();
  const deleteParentesco = useDeleteParentesco();

  const canRead = hasCapability("admin.catalogs.parentescos.read", {
    allOf: ["admin:catalogos:parentescos:read"],
  });
  const canCreate = hasCapability("admin.catalogs.parentescos.create", {
    allOf: ["admin:catalogos:parentescos:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.parentescos.update", {
    allOf: ["admin:catalogos:parentescos:update"],
  });
  const canDelete = hasCapability("admin.catalogs.parentescos.delete", {
    allOf: ["admin:catalogos:parentescos:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useParentescoList(
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
  const isStatusPending = updateParentesco.isPending;

  const handleToggleStatus = async (item: ParentescoListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateParentesco.mutateAsync({
        id: item.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Parentesco activado" : "Parentesco desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getParentescoErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteParentesco.mutateAsync({ id: itemToDelete.id });

      toast.success("Parentesco eliminado", {
        description: `El parentesco ${itemToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getParentescoErrorMessage(
          mutationError,
          "Error al eliminar parentesco",
        ),
      });
    }
  };

  const columns = buildParentescosTableColumns({
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

  const visibilityOptions = buildParentescosVisibilityOptions(showActions);

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
      ? getParentescoErrorMessage(
          error,
          "No se pudo obtener el listado de parentescos. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-parentescos",
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
      id: "export-parentescos",
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
      title="Parentescos"
      description="Catalogo de parentescos para datos del paciente."
      icon={<Users className="size-12" />}
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
                permission="admin:catalogos:parentescos:create"
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
        errorTitle="No se pudo cargar parentescos"
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
        getRowKey={(row) => row.id}
        emptyTitle="Sin parentescos"
        emptyDescription="Cuando existan parentescos registrados se listaran aqui."
      />

      <ParentescoDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        parentescoSummary={selectedItem}
        canEdit={canUpdate}
      />

      <ParentescoCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar parentesco"
        description="Esta accion dara de baja el parentesco y lo quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteParentesco.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default ParentescosPage;
