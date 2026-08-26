import { useState } from "react";
import { toast } from "sonner";
import { Award, Download, Plus, RotateCcw } from "lucide-react";
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
import { CalidadLaboralCreateDialog } from "@features/admin/modules/catalogos/calidad-laboral/components/CalidadLaboralCreateDialog";
import { CalidadLaboralDetailsDialog } from "@features/admin/modules/catalogos/calidad-laboral/components/CalidadLaboralDetailsDialog";
import {
  buildCalidadLaboralTableColumns,
  buildCalidadLaboralVisibilityOptions,
} from "@features/admin/modules/catalogos/calidad-laboral/components/CalidadLaboralTableColumns";
import { useDeleteCalidadLaboral } from "@features/admin/modules/catalogos/calidad-laboral/mutations/useDeleteCalidadLaboral";
import { useUpdateCalidadLaboral } from "@features/admin/modules/catalogos/calidad-laboral/mutations/useUpdateCalidadLaboral";
import { useCalidadLaboralList } from "@features/admin/modules/catalogos/calidad-laboral/queries/useCalidadLaboralList";
import { getCalidadLaboralErrorMessage } from "@features/admin/modules/catalogos/calidad-laboral/utils/calidadLaboral.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { CalidadLaboralListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function CalidadLaboralPage() {
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
  const [itemToDelete, setItemToDelete] = useState<CalidadLaboralListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<CalidadLaboralListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateCalidadLaboral = useUpdateCalidadLaboral();
  const deleteCalidadLaboral = useDeleteCalidadLaboral();

  const canRead = hasCapability("admin.catalogs.calidadLaboral.read", {
    allOf: ["admin:catalogos:calidad_laboral:read"],
  });
  const canCreate = hasCapability("admin.catalogs.calidadLaboral.create", {
    allOf: ["admin:catalogos:calidad_laboral:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.calidadLaboral.update", {
    allOf: ["admin:catalogos:calidad_laboral:update"],
  });
  const canDelete = hasCapability("admin.catalogs.calidadLaboral.delete", {
    allOf: ["admin:catalogos:calidad_laboral:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useCalidadLaboralList(
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
  const isStatusPending = updateCalidadLaboral.isPending;

  const handleToggleStatus = async (item: CalidadLaboralListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateCalidadLaboral.mutateAsync({
        id: item.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Calidad laboral activada" : "Calidad laboral desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getCalidadLaboralErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteCalidadLaboral.mutateAsync({ id: itemToDelete.id });

      toast.success("Calidad laboral eliminada", {
        description: `La calidad laboral ${itemToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getCalidadLaboralErrorMessage(
          mutationError,
          "Error al eliminar calidad laboral",
        ),
      });
    }
  };

  const columns = buildCalidadLaboralTableColumns({
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

  const visibilityOptions = buildCalidadLaboralVisibilityOptions(showActions);

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
      ? getCalidadLaboralErrorMessage(
          error,
          "No se pudo obtener el listado de calidad laboral. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-calidad-laboral",
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
      id: "export-calidad-laboral",
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
      title="Calidad laboral"
      description="Catalogo de clasificacion de calidad laboral."
      icon={<Award className="size-12" />}
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
                permission="admin:catalogos:calidad_laboral:create"
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
        errorTitle="No se pudo cargar calidad laboral"
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
        emptyTitle="Sin registros"
        emptyDescription="Cuando existan calidades laborales registradas se listaran aqui."
      />

      <CalidadLaboralDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        calidadLaboralSummary={selectedItem}
        canEdit={canUpdate}
      />

      <CalidadLaboralCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar calidad laboral"
        description="Esta accion dara de baja la calidad laboral y la quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteCalidadLaboral.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default CalidadLaboralPage;
