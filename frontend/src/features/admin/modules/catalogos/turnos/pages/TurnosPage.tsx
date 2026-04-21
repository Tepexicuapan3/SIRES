import { useState } from "react";
import { toast } from "sonner";
import { Clock, Download, Plus, RotateCcw } from "lucide-react";
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
import { TurnoCreateDialog } from "@features/admin/modules/catalogos/turnos/components/TurnoCreateDialog";
import { TurnoDetailsDialog } from "@features/admin/modules/catalogos/turnos/components/TurnoDetailsDialog";
import {
  buildTurnosTableColumns,
  buildTurnosVisibilityOptions,
} from "@features/admin/modules/catalogos/turnos/components/TurnosTableColumns";
import { useDeleteTurno } from "@features/admin/modules/catalogos/turnos/mutations/useDeleteTurno";
import { useUpdateTurno } from "@features/admin/modules/catalogos/turnos/mutations/useUpdateTurno";
import { useTurnosList } from "@features/admin/modules/catalogos/turnos/queries/useTurnosList";
import { getTurnoErrorMessage } from "@features/admin/modules/catalogos/turnos/utils/turnos.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { TurnoListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function TurnosPage() {
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
  const [turnoToDelete, setTurnoToDelete] = useState<TurnoListItem | null>(
    null,
  );

  const {
    open: detailsOpen,
    selectedItem: selectedTurno,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<TurnoListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateTurno = useUpdateTurno();
  const deleteTurno = useDeleteTurno();

  const canRead = hasCapability("admin.catalogs.turnos.read", {
    allOf: ["admin:catalogos:turnos:read"],
  });
  const canCreate = hasCapability("admin.catalogs.turnos.create", {
    allOf: ["admin:catalogos:turnos:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.turnos.update", {
    allOf: ["admin:catalogos:turnos:update"],
  });
  const canDelete = hasCapability("admin.catalogs.turnos.delete", {
    allOf: ["admin:catalogos:turnos:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useTurnosList(
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
      : allRows.filter((turno) =>
          turno.name.toLowerCase().includes(normalizedSearch),
        );

  const showActions = canRead || canUpdate || canDelete;
  const isStatusPending = updateTurno.isPending;

  const handleToggleStatus = async (turno: TurnoListItem) => {
    const nextStatus = !turno.isActive;

    try {
      await updateTurno.mutateAsync({
        turnoId: turno.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Turno activado" : "Turno desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getTurnoErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteTurno = async () => {
    if (!turnoToDelete) return;

    try {
      await deleteTurno.mutateAsync({ turnoId: turnoToDelete.id });

      toast.success("Turno eliminado", {
        description: `El turno ${turnoToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setTurnoToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getTurnoErrorMessage(
          mutationError,
          "Error al eliminar turno",
        ),
      });
    }
  };

  const columns = buildTurnosTableColumns({
    canRead,
    canUpdate,
    canDelete,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (turno) => {
      void handleToggleStatus(turno);
    },
    onRequestDelete: (turno) => {
      setTurnoToDelete(turno);
      setDeleteOpen(true);
    },
  });

  const visibilityOptions = buildTurnosVisibilityOptions(showActions);

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
      ? getTurnoErrorMessage(
          error,
          "No se pudo obtener el listado de turnos. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-turnos",
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
      id: "export-turnos",
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
      title="Turnos"
      description="Catalogo de turnos operativos del sistema."
      icon={<Clock className="size-12" />}
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
                permission="admin:catalogos:turnos:create"
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
        errorTitle="No se pudo cargar turnos"
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
        emptyTitle="Sin turnos"
        emptyDescription="Cuando existan turnos registrados se listaran aqui."
      />

      <TurnoDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        turnoSummary={selectedTurno}
        canEdit={canUpdate}
      />

      <TurnoCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setTurnoToDelete(null);
        }}
        title="Eliminar turno"
        description="Esta accion dara de baja el turno y lo quitara del catalogo."
        onConfirm={() => {
          void handleDeleteTurno();
        }}
        confirmDisabled={deleteTurno.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default TurnosPage;
