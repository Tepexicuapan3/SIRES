import { useState } from "react";
import { toast } from "sonner";
import { Download, Heart, Plus, RotateCcw } from "lucide-react";
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
import { useDeleteEdoCivil } from "@features/admin/modules/catalogos/edo-civil/mutations/useDeleteEdoCivil";
import { useUpdateEdoCivil } from "@features/admin/modules/catalogos/edo-civil/mutations/useUpdateEdoCivil";
import { useEdoCivilList } from "@features/admin/modules/catalogos/edo-civil/queries/useEdoCivilList";
import {
  buildEdoCivilTableColumns,
  buildEdoCivilVisibilityOptions,
} from "@features/admin/modules/catalogos/edo-civil/components/EdoCivilTableColumns";
import { EdoCivilCreateDialog } from "@features/admin/modules/catalogos/edo-civil/components/EdoCivilCreateDialog";
import { EdoCivilDetailsDialog } from "@features/admin/modules/catalogos/edo-civil/components/EdoCivilDetailsDialog";
import { getEdoCivilErrorMessage } from "@features/admin/modules/catalogos/edo-civil/utils/edoCivil.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { EdoCivilListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function EdoCivilPage() {
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
  const [edoCivilToDelete, setEdoCivilToDelete] =
    useState<EdoCivilListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedEdoCivil,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<EdoCivilListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateEdoCivil = useUpdateEdoCivil();
  const deleteEdoCivil = useDeleteEdoCivil();

  const canReadEdoCivil = hasCapability("admin.catalogs.edo_civil.read", {
    allOf: ["admin:catalogos:edo_civil:read"],
  });
  const canCreateEdoCivil = hasCapability("admin.catalogs.edo_civil.create", {
    allOf: ["admin:catalogos:edo_civil:create"],
  });
  const canUpdateEdoCivil = hasCapability("admin.catalogs.edo_civil.update", {
    allOf: ["admin:catalogos:edo_civil:update"],
  });
  const canDeleteEdoCivil = hasCapability("admin.catalogs.edo_civil.delete", {
    allOf: ["admin:catalogos:edo_civil:delete"],
  });
  const readOnlyCatalogMessage =
    "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } = useEdoCivilList(
    {
      page,
      pageSize,
      isActive:
        statusFilter === STATUS_FILTER.ALL
          ? undefined
          : statusFilter === STATUS_FILTER.ACTIVE,
    },
    { enabled: canReadEdoCivil },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((edoCivil) =>
          normalizeSearchValue(edoCivil.name).includes(normalizedSearch),
        );

  const showActions = canReadEdoCivil || canUpdateEdoCivil || canDeleteEdoCivil;
  const isStatusPending = updateEdoCivil.isPending;

  const handleToggleStatus = async (edoCivil: EdoCivilListItem) => {
    const nextStatus = !edoCivil.isActive;

    try {
      await updateEdoCivil.mutateAsync({
        id: edoCivil.id,
        data: { isActive: nextStatus },
      });
      toast.success(
        nextStatus ? "Estado civil activado" : "Estado civil desactivado",
      );
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getEdoCivilErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteEdoCivil = async () => {
    if (!edoCivilToDelete) return;

    try {
      await deleteEdoCivil.mutateAsync({ id: edoCivilToDelete.id });
      toast.success("Estado civil eliminado", {
        description: `El estado civil ${edoCivilToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setEdoCivilToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getEdoCivilErrorMessage(
          mutationError,
          "Error al eliminar estado civil",
        ),
      });
    }
  };

  const columns = buildEdoCivilTableColumns({
    canReadEdoCivil,
    canUpdateEdoCivil,
    canDeleteEdoCivil,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (edoCivil) => {
      void handleToggleStatus(edoCivil);
    },
    onRequestDelete: (edoCivil) => {
      setEdoCivilToDelete(edoCivil);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildEdoCivilVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(
    Boolean,
  ).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadEdoCivil &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadEdoCivil && error
      ? getEdoCivilErrorMessage(
          error,
          "No se pudo obtener el listado de estados civiles. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-edo-civil",
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
      id: "export-edo-civil",
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
      title="Estado civil"
      description="Catalogo de estados civiles para expedientes."
      icon={<Heart className="size-12" />}
    >
      {!canReadEdoCivil ? (
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
            disabled={!canReadEdoCivil}
          />
        }
        actions={
          <>
            {canReadEdoCivil ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadEdoCivil ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadEdoCivil ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateEdoCivil ? (
              <TablePrimaryAction
                permission="admin:catalogos:edo_civil:create"
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
        isError={canReadEdoCivil && Boolean(error)}
        errorTitle="No se pudo cargar estados civiles"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadEdoCivil ? handleOpenDetails : undefined}
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
        emptyTitle="Sin estados civiles"
        emptyDescription="Cuando existan estados civiles registrados se listaran aqui."
      />

      <EdoCivilDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        edoCivilSummary={selectedEdoCivil}
        canEdit={canUpdateEdoCivil}
      />

      <EdoCivilCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setEdoCivilToDelete(null);
          }
        }}
        title="Eliminar estado civil"
        description="Esta accion dara de baja el estado civil y lo quitara del catalogo."
        onConfirm={() => {
          void handleDeleteEdoCivil();
        }}
        confirmDisabled={deleteEdoCivil.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default EdoCivilPage;
