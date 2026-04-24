import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, Syringe } from "lucide-react";
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
import { VacunaCreateDialog } from "@features/admin/modules/catalogos/vacunas/components/VacunaCreateDialog";
import { VacunaDetailsDialog } from "@features/admin/modules/catalogos/vacunas/components/VacunaDetailsDialog";
import {
  buildVacunasTableColumns,
  buildVacunasVisibilityOptions,
} from "@features/admin/modules/catalogos/vacunas/components/VacunasTableColumns";
import { useDeleteVacuna } from "@features/admin/modules/catalogos/vacunas/mutations/useDeleteVacuna";
import { useUpdateVacuna } from "@features/admin/modules/catalogos/vacunas/mutations/useUpdateVacuna";
import { useVacunasList } from "@features/admin/modules/catalogos/vacunas/queries/useVacunasList";
import { getVacunaErrorMessage } from "@features/admin/modules/catalogos/vacunas/utils/vacunas.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { VacunaListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function VacunasPage() {
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
      isActive: true,
      actions: true,
    });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vacunaToDelete, setVacunaToDelete] = useState<VacunaListItem | null>(
    null,
  );

  const {
    open: detailsOpen,
    selectedItem: selectedVacuna,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<VacunaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateVacuna = useUpdateVacuna();
  const deleteVacuna = useDeleteVacuna();

  const canRead = hasCapability("admin.catalogs.vacunas.read", {
    allOf: ["admin:catalogos:vacunas:read"],
  });
  const canCreate = hasCapability("admin.catalogs.vacunas.create", {
    allOf: ["admin:catalogos:vacunas:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.vacunas.update", {
    allOf: ["admin:catalogos:vacunas:update"],
  });
  const canDelete = hasCapability("admin.catalogs.vacunas.delete", {
    allOf: ["admin:catalogos:vacunas:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useVacunasList(
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
      : allRows.filter((vacuna) =>
          vacuna.name.toLowerCase().includes(normalizedSearch),
        );

  const showActions = canRead || canUpdate || canDelete;
  const isStatusPending = updateVacuna.isPending;

  const handleToggleStatus = async (vacuna: VacunaListItem) => {
    const nextStatus = !vacuna.isActive;

    try {
      await updateVacuna.mutateAsync({
        vacunaId: vacuna.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Vacuna activada" : "Vacuna desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getVacunaErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteVacuna = async () => {
    if (!vacunaToDelete) return;

    try {
      await deleteVacuna.mutateAsync({ vacunaId: vacunaToDelete.id });

      toast.success("Vacuna eliminada", {
        description: `La vacuna "${vacunaToDelete.name}" se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setVacunaToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getVacunaErrorMessage(
          mutationError,
          "Error al eliminar vacuna",
        ),
      });
    }
  };

  const columns = buildVacunasTableColumns({
    canRead,
    canUpdate,
    canDelete,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (vacuna) => {
      void handleToggleStatus(vacuna);
    },
    onRequestDelete: (vacuna) => {
      setVacunaToDelete(vacuna);
      setDeleteOpen(true);
    },
  });

  const visibilityOptions = buildVacunasVisibilityOptions(showActions);

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
      ? getVacunaErrorMessage(
          error,
          "No se pudo obtener el listado de vacunas. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-vacunas",
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
      id: "export-vacunas",
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
      title="Vacunas"
      description="Catalogo de biologicos del programa de vacunacion."
      icon={<Syringe className="size-12" />}
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
                permission="admin:catalogos:vacunas:create"
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
        errorTitle="No se pudo cargar vacunas"
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
        emptyTitle="Sin vacunas"
        emptyDescription="Cuando existan vacunas registradas se listaran aqui."
      />

      <VacunaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        vacunaSummary={selectedVacuna}
        canEdit={canUpdate}
      />

      <VacunaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setVacunaToDelete(null);
        }}
        title="Eliminar vacuna"
        description="Esta accion dara de baja la vacuna y la quitara del catalogo."
        onConfirm={() => {
          void handleDeleteVacuna();
        }}
        confirmDisabled={deleteVacuna.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default VacunasPage;
