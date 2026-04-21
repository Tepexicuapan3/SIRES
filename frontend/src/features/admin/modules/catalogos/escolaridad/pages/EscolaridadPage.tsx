import { useState } from "react";
import { toast } from "sonner";
import { Download, GraduationCap, Plus, RotateCcw } from "lucide-react";
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
import { EscolaridadCreateDialog } from "@features/admin/modules/catalogos/escolaridad/components/EscolaridadCreateDialog";
import { EscolaridadDetailsDialog } from "@features/admin/modules/catalogos/escolaridad/components/EscolaridadDetailsDialog";
import {
  buildEscolaridadTableColumns,
  buildEscolaridadVisibilityOptions,
} from "@features/admin/modules/catalogos/escolaridad/components/EscolaridadTableColumns";
import { useDeleteEscolaridad } from "@features/admin/modules/catalogos/escolaridad/mutations/useDeleteEscolaridad";
import { useUpdateEscolaridad } from "@features/admin/modules/catalogos/escolaridad/mutations/useUpdateEscolaridad";
import { useEscolaridadList } from "@features/admin/modules/catalogos/escolaridad/queries/useEscolaridadList";
import { getEscolaridadErrorMessage } from "@features/admin/modules/catalogos/escolaridad/utils/escolaridad.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { EscolaridadListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function EscolaridadPage() {
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
  const [itemToDelete, setItemToDelete] = useState<EscolaridadListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<EscolaridadListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateEscolaridad = useUpdateEscolaridad();
  const deleteEscolaridad = useDeleteEscolaridad();

  const canRead = hasCapability("admin.catalogs.escolaridad.read", {
    allOf: ["admin:catalogos:escolaridad:read"],
  });
  const canCreate = hasCapability("admin.catalogs.escolaridad.create", {
    allOf: ["admin:catalogos:escolaridad:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.escolaridad.update", {
    allOf: ["admin:catalogos:escolaridad:update"],
  });
  const canDelete = hasCapability("admin.catalogs.escolaridad.delete", {
    allOf: ["admin:catalogos:escolaridad:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useEscolaridadList(
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
  const isStatusPending = updateEscolaridad.isPending;

  const handleToggleStatus = async (item: EscolaridadListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateEscolaridad.mutateAsync({
        id: item.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Escolaridad activada" : "Escolaridad desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getEscolaridadErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteEscolaridad.mutateAsync({ id: itemToDelete.id });

      toast.success("Escolaridad eliminada", {
        description: `El nivel ${itemToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getEscolaridadErrorMessage(
          mutationError,
          "Error al eliminar nivel de escolaridad",
        ),
      });
    }
  };

  const columns = buildEscolaridadTableColumns({
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

  const visibilityOptions = buildEscolaridadVisibilityOptions(showActions);

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
      ? getEscolaridadErrorMessage(
          error,
          "No se pudo obtener el listado de escolaridades. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-escolaridad",
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
      id: "export-escolaridad",
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
      title="Escolaridades"
      description="Catalogo de niveles de escolaridad del sistema."
      icon={<GraduationCap className="size-12" />}
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
                permission="admin:catalogos:escolaridad:create"
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
        errorTitle="No se pudo cargar escolaridades"
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
        emptyTitle="Sin escolaridades"
        emptyDescription="Cuando existan niveles de escolaridad registrados se listaran aqui."
      />

      <EscolaridadDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        escolaridadSummary={selectedItem}
        canEdit={canUpdate}
      />

      <EscolaridadCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar escolaridad"
        description="Esta accion dara de baja el nivel de escolaridad y lo quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteEscolaridad.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default EscolaridadPage;
