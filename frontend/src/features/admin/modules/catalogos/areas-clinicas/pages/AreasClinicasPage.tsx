import { useState } from "react";
import { toast } from "sonner";
import { Building2, Download, Plus, RotateCcw } from "lucide-react";
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
import { AreaClinicaCreateDialog } from "@features/admin/modules/catalogos/areas-clinicas/components/AreaClinicaCreateDialog";
import { AreaClinicaDetailsDialog } from "@features/admin/modules/catalogos/areas-clinicas/components/AreaClinicaDetailsDialog";
import {
  buildAreasClinicasTableColumns,
  buildAreasClinicasVisibilityOptions,
} from "@features/admin/modules/catalogos/areas-clinicas/components/AreasClinicasTableColumns";
import { useDeleteAreaClinica } from "@features/admin/modules/catalogos/areas-clinicas/mutations/useDeleteAreaClinica";
import { useUpdateAreaClinica } from "@features/admin/modules/catalogos/areas-clinicas/mutations/useUpdateAreaClinica";
import { useAreasClinicasList } from "@features/admin/modules/catalogos/areas-clinicas/queries/useAreasClinicasList";
import { getAreaClinicaErrorMessage } from "@features/admin/modules/catalogos/areas-clinicas/utils/areas-clinicas.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { AreaClinicaListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function AreasClinicasPage() {
  const { hasCapability } = usePermissionDependencies();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER.ALL);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    name: true,
    isActive: true,
    actions: true,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<AreaClinicaListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedArea,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<AreaClinicaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateAreaClinica = useUpdateAreaClinica();
  const deleteAreaClinica = useDeleteAreaClinica();

  const canReadAreaClinica = hasCapability("admin.catalogs.areas_clinicas.read", {
    allOf: ["admin:catalogos:areas_clinicas:read"],
  });
  const canCreateAreaClinica = hasCapability("admin.catalogs.areas_clinicas.create", {
    allOf: ["admin:catalogos:areas_clinicas:create"],
  });
  const canUpdateAreaClinica = hasCapability("admin.catalogs.areas_clinicas.update", {
    allOf: ["admin:catalogos:areas_clinicas:update"],
  });
  const canDeleteAreaClinica = hasCapability("admin.catalogs.areas_clinicas.delete", {
    allOf: ["admin:catalogos:areas_clinicas:delete"],
  });

  const readOnlyCatalogMessage = "No tienes acceso para consultar este catálogo.";

  const { data, isLoading, isFetching, error, refetch } = useAreasClinicasList(
    {
      page,
      pageSize,
      isActive:
        statusFilter === STATUS_FILTER.ALL
          ? undefined
          : statusFilter === STATUS_FILTER.ACTIVE,
    },
    { enabled: canReadAreaClinica },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((area) =>
          normalizeSearchValue(area.name).includes(normalizedSearch),
        );

  const showActions = canReadAreaClinica || canUpdateAreaClinica || canDeleteAreaClinica;
  const isStatusPending = updateAreaClinica.isPending;

  const handleToggleStatus = async (area: AreaClinicaListItem) => {
    const nextStatus = !area.isActive;

    try {
      await updateAreaClinica.mutateAsync({
        id: area.id,
        data: { isActive: nextStatus },
      });
      toast.success(nextStatus ? "Área clínica activada" : "Área clínica desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getAreaClinicaErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteArea = async () => {
    if (!areaToDelete) return;

    try {
      await deleteAreaClinica.mutateAsync({ id: areaToDelete.id });
      toast.success("Área clínica eliminada", {
        description: `El área ${areaToDelete.name} se eliminó correctamente.`,
      });
      setDeleteOpen(false);
      setAreaToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getAreaClinicaErrorMessage(
          mutationError,
          "Error al eliminar área clínica",
        ),
      });
    }
  };

  const columns = buildAreasClinicasTableColumns({
    canReadAreaClinica,
    canUpdateAreaClinica,
    canDeleteAreaClinica,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (area) => {
      void handleToggleStatus(area);
    },
    onRequestDelete: (area) => {
      setAreaToDelete(area);
      setDeleteOpen(true);
    },
  });

  const visibilityOptions = buildAreasClinicasVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(Boolean).length;
  const hasFilters =
    canReadAreaClinica &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);

  const tableErrorDescription =
    canReadAreaClinica && error
      ? getAreaClinicaErrorMessage(
          error,
          "No se pudo obtener el listado de áreas clínicas. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-areas-clinicas",
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
      id: "export-areas-clinicas",
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
          label: "Activas",
          selected: statusFilter === STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: STATUS_FILTER.INACTIVE,
          label: "Inactivas",
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
      title="Áreas clínicas"
      description="Catálogo de áreas clínicas por centro de atención."
      icon={<Building2 className="size-12" />}
    >
      {!canReadAreaClinica ? (
        <AdminReadOnlyNotice message={readOnlyCatalogMessage} />
      ) : null}

      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Buscar en la tabla"
            disabled={!canReadAreaClinica}
          />
        }
        actions={
          <>
            {canReadAreaClinica ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadAreaClinica ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadAreaClinica ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateAreaClinica ? (
              <TablePrimaryAction
                permission="admin:catalogos:areas_clinicas:create"
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
        isLoading={isLoading}
        isError={canReadAreaClinica && Boolean(error)}
        errorTitle="No se pudo cargar áreas clínicas"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadAreaClinica ? handleOpenDetails : undefined}
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
        emptyTitle="Sin áreas clínicas"
        emptyDescription="Cuando existan áreas clínicas registradas se listarán aquí."
      />

      <AreaClinicaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        areaSummary={selectedArea}
        canEdit={canUpdateAreaClinica}
      />

      <AreaClinicaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setAreaToDelete(null);
          }
        }}
        title="Eliminar área clínica"
        description="Esta acción dará de baja el área clínica y la quitará del catálogo."
        onConfirm={() => {
          void handleDeleteArea();
        }}
        confirmDisabled={deleteAreaClinica.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default AreasClinicasPage;
