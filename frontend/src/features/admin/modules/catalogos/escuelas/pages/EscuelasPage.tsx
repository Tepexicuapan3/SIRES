import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, School } from "lucide-react";
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
import { useDeleteEscuela } from "@features/admin/modules/catalogos/escuelas/mutations/useDeleteEscuela";
import { useUpdateEscuela } from "@features/admin/modules/catalogos/escuelas/mutations/useUpdateEscuela";
import { useEscuelasList } from "@features/admin/modules/catalogos/escuelas/queries/useEscuelasList";
import {
  buildEscuelasTableColumns,
  buildEscuelasVisibilityOptions,
} from "@features/admin/modules/catalogos/escuelas/components/EscuelasTableColumns";
import { EscuelaCreateDialog } from "@features/admin/modules/catalogos/escuelas/components/EscuelaCreateDialog";
import { EscuelaDetailsDialog } from "@features/admin/modules/catalogos/escuelas/components/EscuelaDetailsDialog";
import { getEscuelaErrorMessage } from "@features/admin/modules/catalogos/escuelas/utils/escuelas.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { EscuelaListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function EscuelasPage() {
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
  const [escuelaToDelete, setEscuelaToDelete] =
    useState<EscuelaListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedEscuela,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<EscuelaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateEscuela = useUpdateEscuela();
  const deleteEscuela = useDeleteEscuela();

  const canReadEscuela = hasCapability("admin.catalogs.escuelas.read", {
    allOf: ["admin:catalogos:escuelas:read"],
  });
  const canCreateEscuela = hasCapability("admin.catalogs.escuelas.create", {
    allOf: ["admin:catalogos:escuelas:create"],
  });
  const canUpdateEscuela = hasCapability("admin.catalogs.escuelas.update", {
    allOf: ["admin:catalogos:escuelas:update"],
  });
  const canDeleteEscuela = hasCapability("admin.catalogs.escuelas.delete", {
    allOf: ["admin:catalogos:escuelas:delete"],
  });
  const readOnlyCatalogMessage =
    "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } = useEscuelasList(
    {
      page,
      pageSize,
      isActive:
        statusFilter === STATUS_FILTER.ALL
          ? undefined
          : statusFilter === STATUS_FILTER.ACTIVE,
    },
    { enabled: canReadEscuela },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((escuela) => {
          const matchesName = normalizeSearchValue(escuela.name).includes(
            normalizedSearch,
          );
          const matchesCode = normalizeSearchValue(escuela.code).includes(
            normalizedSearch,
          );
          return matchesName || matchesCode;
        });

  const showActions = canReadEscuela || canUpdateEscuela || canDeleteEscuela;
  const isStatusPending = updateEscuela.isPending;

  const handleToggleStatus = async (escuela: EscuelaListItem) => {
    const nextStatus = !escuela.isActive;

    try {
      await updateEscuela.mutateAsync({
        id: escuela.id,
        data: { isActive: nextStatus },
      });
      toast.success(nextStatus ? "Escuela activada" : "Escuela desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getEscuelaErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteEscuela = async () => {
    if (!escuelaToDelete) return;

    try {
      await deleteEscuela.mutateAsync({ id: escuelaToDelete.id });
      toast.success("Escuela eliminada", {
        description: `La escuela ${escuelaToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setEscuelaToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getEscuelaErrorMessage(
          mutationError,
          "Error al eliminar escuela",
        ),
      });
    }
  };

  const columns = buildEscuelasTableColumns({
    canReadEscuela,
    canUpdateEscuela,
    canDeleteEscuela,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (escuela) => {
      void handleToggleStatus(escuela);
    },
    onRequestDelete: (escuela) => {
      setEscuelaToDelete(escuela);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildEscuelasVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(
    Boolean,
  ).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadEscuela &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadEscuela && error
      ? getEscuelaErrorMessage(
          error,
          "No se pudo obtener el listado de escuelas. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-escuelas",
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
      id: "export-escuelas",
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
      title="Escuelas"
      description="Catalogo de escuelas y centros educativos del sistema."
      icon={<School className="size-12" />}
    >
      {!canReadEscuela ? (
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
            disabled={!canReadEscuela}
          />
        }
        actions={
          <>
            {canReadEscuela ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadEscuela ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadEscuela ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateEscuela ? (
              <TablePrimaryAction
                permission="admin:catalogos:escuelas:create"
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
        isError={canReadEscuela && Boolean(error)}
        errorTitle="No se pudo cargar escuelas"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadEscuela ? handleOpenDetails : undefined}
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
        emptyTitle="Sin escuelas"
        emptyDescription="Cuando existan escuelas registradas se listaran aqui."
      />

      <EscuelaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        escuelaSummary={selectedEscuela}
        canEdit={canUpdateEscuela}
      />

      <EscuelaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setEscuelaToDelete(null);
          }
        }}
        title="Eliminar escuela"
        description="Esta accion dara de baja la escuela y la quitara del catalogo."
        onConfirm={() => {
          void handleDeleteEscuela();
        }}
        confirmDisabled={deleteEscuela.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default EscuelasPage;
