import { useState } from "react";
import { toast } from "sonner";
import { Accessibility, Download, Plus, RotateCcw } from "lucide-react";
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
import { useDeleteDiscapacidad } from "@features/admin/modules/catalogos/discapacidades/mutations/useDeleteDiscapacidad";
import { useUpdateDiscapacidad } from "@features/admin/modules/catalogos/discapacidades/mutations/useUpdateDiscapacidad";
import { useDiscapacidadesList } from "@features/admin/modules/catalogos/discapacidades/queries/useDiscapacidadesList";
import {
  buildDiscapacidadesTableColumns,
  buildDiscapacidadesVisibilityOptions,
} from "@features/admin/modules/catalogos/discapacidades/components/DiscapacidadesTableColumns";
import { DiscapacidadCreateDialog } from "@features/admin/modules/catalogos/discapacidades/components/DiscapacidadCreateDialog";
import { DiscapacidadDetailsDialog } from "@features/admin/modules/catalogos/discapacidades/components/DiscapacidadDetailsDialog";
import { getDiscapacidadErrorMessage } from "@features/admin/modules/catalogos/discapacidades/utils/discapacidades.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { DiscapacidadListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function DiscapacidadesPage() {
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
  const [discapacidadToDelete, setDiscapacidadToDelete] =
    useState<DiscapacidadListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedDiscapacidad,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<DiscapacidadListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateDiscapacidad = useUpdateDiscapacidad();
  const deleteDiscapacidad = useDeleteDiscapacidad();

  const canReadDiscapacidad = hasCapability("admin.catalogs.discapacidades.read", {
    allOf: ["admin:catalogos:discapacidades:read"],
  });
  const canCreateDiscapacidad = hasCapability("admin.catalogs.discapacidades.create", {
    allOf: ["admin:catalogos:discapacidades:create"],
  });
  const canUpdateDiscapacidad = hasCapability("admin.catalogs.discapacidades.update", {
    allOf: ["admin:catalogos:discapacidades:update"],
  });
  const canDeleteDiscapacidad = hasCapability("admin.catalogs.discapacidades.delete", {
    allOf: ["admin:catalogos:discapacidades:delete"],
  });
  const readOnlyCatalogMessage =
    "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } = useDiscapacidadesList(
    {
      page,
      pageSize,
      isActive:
        statusFilter === STATUS_FILTER.ALL
          ? undefined
          : statusFilter === STATUS_FILTER.ACTIVE,
    },
    { enabled: canReadDiscapacidad },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((discapacidad) => {
          const matchesName = normalizeSearchValue(discapacidad.name).includes(
            normalizedSearch,
          );
          const matchesCode = normalizeSearchValue(discapacidad.code).includes(
            normalizedSearch,
          );
          return matchesName || matchesCode;
        });

  const showActions = canReadDiscapacidad || canUpdateDiscapacidad || canDeleteDiscapacidad;
  const isStatusPending = updateDiscapacidad.isPending;

  const handleToggleStatus = async (discapacidad: DiscapacidadListItem) => {
    const nextStatus = !discapacidad.isActive;

    try {
      await updateDiscapacidad.mutateAsync({
        id: discapacidad.id,
        data: { isActive: nextStatus },
      });
      toast.success(nextStatus ? "Discapacidad activada" : "Discapacidad desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getDiscapacidadErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteDiscapacidad = async () => {
    if (!discapacidadToDelete) return;

    try {
      await deleteDiscapacidad.mutateAsync({ id: discapacidadToDelete.id });
      toast.success("Discapacidad eliminada", {
        description: `La discapacidad ${discapacidadToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setDiscapacidadToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getDiscapacidadErrorMessage(
          mutationError,
          "Error al eliminar discapacidad",
        ),
      });
    }
  };

  const columns = buildDiscapacidadesTableColumns({
    canReadDiscapacidad,
    canUpdateDiscapacidad,
    canDeleteDiscapacidad,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (discapacidad) => {
      void handleToggleStatus(discapacidad);
    },
    onRequestDelete: (discapacidad) => {
      setDiscapacidadToDelete(discapacidad);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildDiscapacidadesVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(
    Boolean,
  ).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadDiscapacidad &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadDiscapacidad && error
      ? getDiscapacidadErrorMessage(
          error,
          "No se pudo obtener el listado de discapacidades. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-discapacidades",
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
      id: "export-discapacidades",
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
      title="Discapacidades"
      description="Catalogo de discapacidades del sistema."
      icon={<Accessibility className="size-12" />}
    >
      {!canReadDiscapacidad ? (
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
            disabled={!canReadDiscapacidad}
          />
        }
        actions={
          <>
            {canReadDiscapacidad ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadDiscapacidad ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadDiscapacidad ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateDiscapacidad ? (
              <TablePrimaryAction
                permission="admin:catalogos:discapacidades:create"
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
        isError={canReadDiscapacidad && Boolean(error)}
        errorTitle="No se pudo cargar discapacidades"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadDiscapacidad ? handleOpenDetails : undefined}
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
        emptyTitle="Sin discapacidades"
        emptyDescription="Cuando existan discapacidades registradas se listaran aqui."
      />

      <DiscapacidadDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        discapacidadSummary={selectedDiscapacidad}
        canEdit={canUpdateDiscapacidad}
      />

      <DiscapacidadCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setDiscapacidadToDelete(null);
          }
        }}
        title="Eliminar discapacidad"
        description="Esta accion dara de baja la discapacidad y la quitara del catalogo."
        onConfirm={() => {
          void handleDeleteDiscapacidad();
        }}
        confirmDisabled={deleteDiscapacidad.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default DiscapacidadesPage;
