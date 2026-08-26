import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, Thermometer } from "lucide-react";
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
import { EnfermedadCreateDialog } from "@features/admin/modules/catalogos/enfermedades/components/EnfermedadCreateDialog";
import { EnfermedadDetailsDialog } from "@features/admin/modules/catalogos/enfermedades/components/EnfermedadDetailsDialog";
import {
  buildEnfermedadesTableColumns,
  buildEnfermedadesVisibilityOptions,
} from "@features/admin/modules/catalogos/enfermedades/components/EnfermedadesTableColumns";
import { useDeleteEnfermedad } from "@features/admin/modules/catalogos/enfermedades/mutations/useDeleteEnfermedad";
import { useUpdateEnfermedad } from "@features/admin/modules/catalogos/enfermedades/mutations/useUpdateEnfermedad";
import { useEnfermedadesList } from "@features/admin/modules/catalogos/enfermedades/queries/useEnfermedadesList";
import { getEnfermedadErrorMessage } from "@features/admin/modules/catalogos/enfermedades/utils/enfermedades.feedback";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { EnfermedadListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function EnfermedadesPage() {
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
      cieVersion: true,
      isActive: true,
      actions: true,
    });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EnfermedadListItem | null>(
    null,
  );

  const {
    open: detailsOpen,
    selectedItem,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<EnfermedadListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateEnfermedad = useUpdateEnfermedad();
  const deleteEnfermedad = useDeleteEnfermedad();

  const canRead = hasCapability("admin.catalogs.enfermedades.read", {
    allOf: ["admin:catalogos:enfermedades:read"],
  });
  const canCreate = hasCapability("admin.catalogs.enfermedades.create", {
    allOf: ["admin:catalogos:enfermedades:create"],
  });
  const canUpdate = hasCapability("admin.catalogs.enfermedades.update", {
    allOf: ["admin:catalogos:enfermedades:update"],
  });
  const canDelete = hasCapability("admin.catalogs.enfermedades.delete", {
    allOf: ["admin:catalogos:enfermedades:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useEnfermedadesList(
    {
      page,
      pageSize,
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
      : allRows.filter((item) => {
          const matchesName = normalizeSearchValue(item.name).includes(
            normalizedSearch,
          );
          const matchesCode = normalizeSearchValue(item.code).includes(
            normalizedSearch,
          );
          return matchesName || matchesCode;
        });

  const showActions = canRead || canUpdate || canDelete;
  const isStatusPending = updateEnfermedad.isPending;

  const handleToggleStatus = async (item: EnfermedadListItem) => {
    const nextStatus = !item.isActive;

    try {
      await updateEnfermedad.mutateAsync({
        id: item.id,
        data: { isActive: nextStatus },
      });

      toast.success(nextStatus ? "Enfermedad activada" : "Enfermedad desactivada");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getEnfermedadErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteEnfermedad.mutateAsync({ id: itemToDelete.id });

      toast.success("Enfermedad eliminada", {
        description: `La enfermedad ${itemToDelete.name} se elimino correctamente.`,
      });

      setDeleteOpen(false);
      setItemToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getEnfermedadErrorMessage(
          mutationError,
          "Error al eliminar enfermedad",
        ),
      });
    }
  };

  const columns = buildEnfermedadesTableColumns({
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

  const visibilityOptions = buildEnfermedadesVisibilityOptions(showActions);

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
      ? getEnfermedadErrorMessage(
          error,
          "No se pudo obtener el listado de enfermedades. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-enfermedades",
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
      id: "export-enfermedades",
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
      title="Enfermedades"
      description="Catalogo base de enfermedades clinicas (CIE)."
      icon={<Thermometer className="size-12" />}
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
            placeholder="Buscar por nombre o codigo"
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
                permission="admin:catalogos:enfermedades:create"
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
        errorTitle="No se pudo cargar enfermedades"
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
        emptyTitle="Sin enfermedades"
        emptyDescription="Cuando existan enfermedades registradas se listaran aqui."
      />

      <EnfermedadDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        enfermedadSummary={selectedItem}
        canEdit={canUpdate}
      />

      <EnfermedadCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) setItemToDelete(null);
        }}
        title="Eliminar enfermedad"
        description="Esta accion dara de baja la enfermedad y la quitara del catalogo."
        onConfirm={() => {
          void handleDelete();
        }}
        confirmDisabled={deleteEnfermedad.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default EnfermedadesPage;
