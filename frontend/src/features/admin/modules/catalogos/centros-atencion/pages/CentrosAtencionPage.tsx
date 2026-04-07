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
import { CentroAtencionCreateDialog } from "@features/admin/modules/catalogos/centros-atencion/components/CentroAtencionCreateDialog";
import { CentroAtencionDetailsDialog } from "@features/admin/modules/catalogos/centros-atencion/components/CentroAtencionDetailsDialog";
import {
  buildCentrosAtencionTableColumns,
  buildCentrosAtencionVisibilityOptions,
} from "@features/admin/modules/catalogos/centros-atencion/components/CentrosAtencionTableColumns";
import { useDeleteCentroAtencion } from "@features/admin/modules/catalogos/centros-atencion/mutations/useDeleteCentroAtencion";
import { useUpdateCentroAtencion } from "@features/admin/modules/catalogos/centros-atencion/mutations/useUpdateCentroAtencion";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { getCentroAtencionErrorMessage } from "@features/admin/modules/catalogos/centros-atencion/utils/centros-atencion.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { CentroAtencionListItem } from "@api/types";

const CENTER_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

const CENTER_TYPE_FILTER = {
  ALL: "all",
  INTERNAL: "internal",
  EXTERNAL: "external",
} as const;

type CenterStatusFilter =
  (typeof CENTER_STATUS_FILTER)[keyof typeof CENTER_STATUS_FILTER];
type CenterTypeFilter =
  (typeof CENTER_TYPE_FILTER)[keyof typeof CENTER_TYPE_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function CentrosAtencionPage() {
  const { hasCapability } = usePermissionDependencies();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CenterStatusFilter>(
    CENTER_STATUS_FILTER.ALL,
  );
  const [typeFilter, setTypeFilter] = useState<CenterTypeFilter>(
    CENTER_TYPE_FILTER.ALL,
  );
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      name: true,
      folioCode: true,
      isExternal: true,
      isActive: true,
      actions: true,
    });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [centerToDelete, setCenterToDelete] =
    useState<CentroAtencionListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedCenter,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<CentroAtencionListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateCenter = useUpdateCentroAtencion();
  const deleteCenter = useDeleteCentroAtencion();

  const canReadCenter = hasCapability("admin.catalogs.centers.read", {
    allOf: ["admin:catalogos:centros_atencion:read"],
  });
  const canCreateCenter = hasCapability("admin.catalogs.centers.create", {
    allOf: ["admin:catalogos:centros_atencion:create"],
  });
  const canUpdateCenter = hasCapability("admin.catalogs.centers.update", {
    allOf: ["admin:catalogos:centros_atencion:update"],
  });
  const canDeleteCenter = hasCapability("admin.catalogs.centers.delete", {
    allOf: ["admin:catalogos:centros_atencion:delete"],
  });
  const readOnlyCatalogMessage =
    "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } =
    useCentrosAtencionList(
      {
        page,
        pageSize,
        isActive:
          statusFilter === CENTER_STATUS_FILTER.ALL
            ? undefined
            : statusFilter === CENTER_STATUS_FILTER.ACTIVE,
        isExternal:
          typeFilter === CENTER_TYPE_FILTER.ALL
            ? undefined
            : typeFilter === CENTER_TYPE_FILTER.EXTERNAL,
      },
      {
        enabled: canReadCenter,
      },
    );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((center) => {
          const matchesName = normalizeSearchValue(center.name).includes(
            normalizedSearch,
          );
          const matchesFolio = normalizeSearchValue(center.folioCode).includes(
            normalizedSearch,
          );
          return matchesName || matchesFolio;
        });

  const showActions = canReadCenter || canUpdateCenter || canDeleteCenter;
  const isStatusPending = updateCenter.isPending;

  const handleToggleStatus = async (center: CentroAtencionListItem) => {
    const nextStatus = !center.isActive;

    try {
      await updateCenter.mutateAsync({
        centerId: center.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Centro activado" : "Centro desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getCentroAtencionErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteCenter = async () => {
    if (!centerToDelete) return;

    try {
      await deleteCenter.mutateAsync({ centerId: centerToDelete.id });
      toast.success("Centro eliminado", {
        description: `El centro ${centerToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setCenterToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getCentroAtencionErrorMessage(
          mutationError,
          "Error al eliminar centro",
        ),
      });
    }
  };

  const columns = buildCentrosAtencionTableColumns({
    canReadCenter,
    canUpdateCenter,
    canDeleteCenter,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (center) => {
      void handleToggleStatus(center);
    },
    onRequestDelete: (center) => {
      setCenterToDelete(center);
      setDeleteOpen(true);
    },
  });

  const visibilityOptions = buildCentrosAtencionVisibilityOptions(showActions);
  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [
    statusFilter !== CENTER_STATUS_FILTER.ALL,
    typeFilter !== CENTER_TYPE_FILTER.ALL,
  ].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadCenter &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadCenter && error
      ? getCentroAtencionErrorMessage(
          error,
          "No se pudo obtener el listado de centros. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(CENTER_STATUS_FILTER.ALL);
    setTypeFilter(CENTER_TYPE_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-centers",
      label: "Actualizar",
      icon: RotateCcw,
      isLoading: isFetching,
      disabled: isFetching,
      onSelect: () => {
        if (isFetching) {
          return;
        }

        void refetch();
      },
    },
    {
      id: "export-centers",
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
          id: CENTER_STATUS_FILTER.ACTIVE,
          label: "Activos",
          selected: statusFilter === CENTER_STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(CENTER_STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: CENTER_STATUS_FILTER.INACTIVE,
          label: "Inactivos",
          selected: statusFilter === CENTER_STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(CENTER_STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
    {
      id: "type",
      label: "Tipo",
      options: [
        {
          id: CENTER_TYPE_FILTER.INTERNAL,
          label: "Internos",
          selected: typeFilter === CENTER_TYPE_FILTER.INTERNAL,
          onSelect: () => {
            setTypeFilter(CENTER_TYPE_FILTER.INTERNAL);
            setPage(1);
          },
        },
        {
          id: CENTER_TYPE_FILTER.EXTERNAL,
          label: "Externos",
          selected: typeFilter === CENTER_TYPE_FILTER.EXTERNAL,
          onSelect: () => {
            setTypeFilter(CENTER_TYPE_FILTER.EXTERNAL);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Centros de atencion"
      description="Catalogo operativo de clinicas, hospitales y sanatorios del sistema."
      icon={<Building2 className="size-12" />}
    >
      {!canReadCenter ? (
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
            disabled={!canReadCenter}
          />
        }
        actions={
          <>
            {canReadCenter ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadCenter ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadCenter ? <TableOptionsMenu options={tableOptions} /> : null}
            {canCreateCenter ? (
              <TablePrimaryAction
                permission="admin:catalogos:centros_atencion:create"
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
        isError={canReadCenter && Boolean(error)}
        errorTitle="No se pudo cargar centros"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadCenter ? handleOpenDetails : undefined}
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
        emptyTitle="Sin centros"
        emptyDescription="Cuando existan centros registrados se listaran aqui."
      />

      <CentroAtencionDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        centerSummary={selectedCenter}
        canEdit={canUpdateCenter}
      />

      <CentroAtencionCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setCenterToDelete(null);
          }
        }}
        title="Eliminar centro"
        description="Esta accion dara de baja el centro y lo quitara del catalogo."
        onConfirm={() => {
          void handleDeleteCenter();
        }}
        confirmDisabled={deleteCenter.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default CentrosAtencionPage;
