import { useState } from "react";
import { toast } from "sonner";
import { Download, Link2, Plus, RotateCcw } from "lucide-react";
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
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { CentroAreaClinicaCreateDialog } from "@features/admin/modules/catalogos/centro-area-clinica/components/CentroAreaClinicaCreateDialog";
import { CentroAreaClinicaDetailsDialog } from "@features/admin/modules/catalogos/centro-area-clinica/components/CentroAreaClinicaDetailsDialog";
import {
  buildCentrosAreasClinicasTableColumns,
  buildCentrosAreasClinicasVisibilityOptions,
} from "@features/admin/modules/catalogos/centro-area-clinica/components/CentrosAreasClinicasTableColumns";
import { useDeleteCentroAreaClinica } from "@features/admin/modules/catalogos/centro-area-clinica/mutations/useDeleteCentroAreaClinica";
import { useUpdateCentroAreaClinica } from "@features/admin/modules/catalogos/centro-area-clinica/mutations/useUpdateCentroAreaClinica";
import { useCentrosAreasClinicasList } from "@features/admin/modules/catalogos/centro-area-clinica/queries/useCentrosAreasClinicasList";
import { getCentroAreaClinicaErrorMessage } from "@features/admin/modules/catalogos/centro-area-clinica/utils/centro-area-clinica.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { CentroAreaClinicaListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const normalizeSearchValue = (value: string | null | undefined) =>
  String(value ?? "").toLowerCase();

export function CentrosAreasClinicasPage() {
  const { hasCapability } = usePermissionDependencies();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTER.ALL);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    center: true,
    areaClinica: true,
    isActive: true,
    actions: true,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CentroAreaClinicaListItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CentroAreaClinicaListItem | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const updateItem = useUpdateCentroAreaClinica();
  const deleteItem = useDeleteCentroAreaClinica();

  const canReadCentroAreaClinica = hasCapability("admin.catalogs.centroAreaClinica.read", {
    allOf: ["admin:catalogos:centro_area_clinica:read"],
  });
  const canCreateCentroAreaClinica = hasCapability("admin.catalogs.centroAreaClinica.create", {
    allOf: ["admin:catalogos:centro_area_clinica:create"],
  });
  const canUpdateCentroAreaClinica = hasCapability("admin.catalogs.centroAreaClinica.update", {
    allOf: ["admin:catalogos:centro_area_clinica:update"],
  });
  const canDeleteCentroAreaClinica = hasCapability("admin.catalogs.centroAreaClinica.delete", {
    allOf: ["admin:catalogos:centro_area_clinica:delete"],
  });

  const readOnlyCatalogMessage = "No tienes acceso para consultar este catálogo.";

  const { data, isLoading, isFetching, error, refetch } = useCentrosAreasClinicasList(
    {
      page,
      pageSize,
      isActive:
        statusFilter === STATUS_FILTER.ALL
          ? undefined
          : statusFilter === STATUS_FILTER.ACTIVE,
    },
    { enabled: canReadCentroAreaClinica },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter(
          (item) =>
            normalizeSearchValue(item.center.name).includes(normalizedSearch) ||
            normalizeSearchValue(item.areaClinica.name).includes(normalizedSearch),
        );

  const showActions =
    canReadCentroAreaClinica || canUpdateCentroAreaClinica || canDeleteCentroAreaClinica;
  const isStatusPending = updateItem.isPending;

  const handleOpenDetails = (item: CentroAreaClinicaListItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
    setDetailsOpen(false);
  };

  const handleToggleStatus = async (item: CentroAreaClinicaListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateItem.mutateAsync({
        centerId: item.center.id,
        areaId: item.areaClinica.id,
        data: { isActive: nextStatus },
      });
      toast.success(nextStatus ? "Asignación activada" : "Asignación desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getCentroAreaClinicaErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem.mutateAsync({
        centerId: itemToDelete.center.id,
        areaId: itemToDelete.areaClinica.id,
      });
      toast.success("Asignación eliminada", {
        description: `El área "${itemToDelete.areaClinica.name}" fue removida de "${itemToDelete.center.name}".`,
      });
      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getCentroAreaClinicaErrorMessage(
          mutationError,
          "Error al eliminar asignación",
        ),
      });
    }
  };

  const columns = buildCentrosAreasClinicasTableColumns({
    canReadCentroAreaClinica,
    canUpdateCentroAreaClinica,
    canDeleteCentroAreaClinica,
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

  const visibilityOptions = buildCentrosAreasClinicasVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(Boolean).length;
  const hasFilters =
    canReadCentroAreaClinica &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);

  const tableErrorDescription =
    canReadCentroAreaClinica && error
      ? getCentroAreaClinicaErrorMessage(
          error,
          "No se pudo obtener el listado. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-centro-area-clinica",
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
      id: "export-centro-area-clinica",
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
      title="Áreas clínicas por centro"
      description="Asignación de áreas clínicas a centros de atención."
      icon={<Link2 className="size-12" />}
    >
      {!canReadCentroAreaClinica ? (
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
            placeholder="Buscar por centro o área"
            disabled={!canReadCentroAreaClinica}
          />
        }
        actions={
          <>
            {canReadCentroAreaClinica ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadCentroAreaClinica ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadCentroAreaClinica ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateCentroAreaClinica ? (
              <TablePrimaryAction
                permission="admin:catalogos:centro_area_clinica:create"
                dependencyAware
                label="Asignar"
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
        isError={canReadCentroAreaClinica && Boolean(error)}
        errorTitle="No se pudo cargar las asignaciones"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadCentroAreaClinica ? handleOpenDetails : undefined}
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
        getRowKey={(row) => `${row.center.id}-${row.areaClinica.id}`}
        emptyTitle="Sin asignaciones"
        emptyDescription="Cuando existan áreas clínicas asignadas a centros se listarán aquí."
      />

      <CentroAreaClinicaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        selectedItem={selectedItem}
        canEdit={canUpdateCentroAreaClinica}
      />

      <CentroAreaClinicaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar asignación"
        description="Esta acción quitará el área clínica del centro de atención."
        onConfirm={() => {
          void handleDeleteItem();
        }}
        confirmDisabled={deleteItem.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default CentrosAreasClinicasPage;
