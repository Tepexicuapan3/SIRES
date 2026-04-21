import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, Tag } from "lucide-react";
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
import { useTableDetailsDialog } from "@features/admin/shared/hooks/useTableDetailsDialog";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { useDeleteTipoArea } from "@features/admin/modules/catalogos/tipos-areas/mutations/useDeleteTipoArea";
import { useUpdateTipoArea } from "@features/admin/modules/catalogos/tipos-areas/mutations/useUpdateTipoArea";
import { useTiposAreasList } from "@features/admin/modules/catalogos/tipos-areas/queries/useTiposAreasList";
import {
  buildTiposAreasTableColumns,
  buildTiposAreasVisibilityOptions,
} from "@features/admin/modules/catalogos/tipos-areas/components/TiposAreasTableColumns";
import { TipoAreaCreateDialog } from "@features/admin/modules/catalogos/tipos-areas/components/TipoAreaCreateDialog";
import { TipoAreaDetailsDialog } from "@features/admin/modules/catalogos/tipos-areas/components/TipoAreaDetailsDialog";
import { getTipoAreaErrorMessage } from "@features/admin/modules/catalogos/tipos-areas/utils/tipos-areas.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { TipoAreaListItem } from "@api/types";

const TIPO_AREA_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type TipoAreaStatusFilter =
  (typeof TIPO_AREA_STATUS_FILTER)[keyof typeof TIPO_AREA_STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function TiposAreasPage() {
  const { hasCapability } = usePermissionDependencies();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TipoAreaStatusFilter>(
    TIPO_AREA_STATUS_FILTER.ALL,
  );
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      name: true,
      isActive: true,
      actions: true,
    });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tipoAreaToDelete, setTipoAreaToDelete] =
    useState<TipoAreaListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedTipoArea,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<TipoAreaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateTipoArea = useUpdateTipoArea();
  const deleteTipoArea = useDeleteTipoArea();

  const canReadTipoArea = hasCapability("admin.catalogs.tiposAreas.read", {
    allOf: ["admin:catalogos:tipos_areas:read"],
  });
  const canCreateTipoArea = hasCapability("admin.catalogs.tiposAreas.create", {
    allOf: ["admin:catalogos:tipos_areas:create"],
  });
  const canUpdateTipoArea = hasCapability("admin.catalogs.tiposAreas.update", {
    allOf: ["admin:catalogos:tipos_areas:update"],
  });
  const canDeleteTipoArea = hasCapability("admin.catalogs.tiposAreas.delete", {
    allOf: ["admin:catalogos:tipos_areas:delete"],
  });
  const readOnlyCatalogMessage =
    "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } = useTiposAreasList(
    {
      page,
      pageSize,
      isActive:
        statusFilter === TIPO_AREA_STATUS_FILTER.ALL
          ? undefined
          : statusFilter === TIPO_AREA_STATUS_FILTER.ACTIVE,
    },
    {
      enabled: canReadTipoArea,
    },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((tipoArea) =>
          normalizeSearchValue(tipoArea.name).includes(normalizedSearch),
        );

  const showActions = canReadTipoArea || canUpdateTipoArea || canDeleteTipoArea;
  const isStatusPending = updateTipoArea.isPending;

  const handleToggleStatus = async (tipoArea: TipoAreaListItem) => {
    const nextStatus = !tipoArea.isActive;

    try {
      await updateTipoArea.mutateAsync({
        id: tipoArea.id,
        data: { isActive: nextStatus },
      });
      toast.success(
        nextStatus ? "Tipo de area activado" : "Tipo de area desactivado",
      );
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoAreaErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteTipoArea = async () => {
    if (!tipoAreaToDelete) return;

    try {
      await deleteTipoArea.mutateAsync({ id: tipoAreaToDelete.id });
      toast.success("Tipo de area eliminado", {
        description: `El tipo de area ${tipoAreaToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setTipoAreaToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getTipoAreaErrorMessage(
          mutationError,
          "Error al eliminar tipo de area",
        ),
      });
    }
  };

  const columns = buildTiposAreasTableColumns({
    canReadTipoArea,
    canUpdateTipoArea,
    canDeleteTipoArea,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (tipoArea) => {
      void handleToggleStatus(tipoArea);
    },
    onRequestDelete: (tipoArea) => {
      setTipoAreaToDelete(tipoArea);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildTiposAreasVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [
    statusFilter !== TIPO_AREA_STATUS_FILTER.ALL,
  ].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadTipoArea &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadTipoArea && error
      ? getTipoAreaErrorMessage(
          error,
          "No se pudo obtener el listado de tipos de area. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(TIPO_AREA_STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-tipos-areas",
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
      id: "export-tipos-areas",
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
          id: TIPO_AREA_STATUS_FILTER.ACTIVE,
          label: "Activos",
          selected: statusFilter === TIPO_AREA_STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(TIPO_AREA_STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: TIPO_AREA_STATUS_FILTER.INACTIVE,
          label: "Inactivos",
          selected: statusFilter === TIPO_AREA_STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(TIPO_AREA_STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Tipos de area"
      description="Catalogo de tipos de area operativa del sistema."
      icon={<Tag className="size-12" />}
    >
      {!canReadTipoArea ? (
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
            disabled={!canReadTipoArea}
          />
        }
        actions={
          <>
            {canReadTipoArea ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadTipoArea ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadTipoArea ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateTipoArea ? (
              <TablePrimaryAction
                permission="admin:catalogos:tipos_areas:create"
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
        isError={canReadTipoArea && Boolean(error)}
        errorTitle="No se pudo cargar tipos de area"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadTipoArea ? handleOpenDetails : undefined}
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
        emptyTitle="Sin tipos de area"
        emptyDescription="Cuando existan tipos de area registrados se listaran aqui."
      />

      <TipoAreaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        tipoAreaSummary={selectedTipoArea}
        canEdit={canUpdateTipoArea}
      />

      <TipoAreaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setTipoAreaToDelete(null);
          }
        }}
        title="Eliminar tipo de area"
        description="Esta accion dara de baja el tipo de area y lo quitara del catalogo."
        onConfirm={() => {
          void handleDeleteTipoArea();
        }}
        confirmDisabled={deleteTipoArea.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default TiposAreasPage;
