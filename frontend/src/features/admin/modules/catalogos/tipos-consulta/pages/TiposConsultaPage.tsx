import { useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Download, Plus, RotateCcw } from "lucide-react";
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
import { useDeleteTipoConsulta } from "@features/admin/modules/catalogos/tipos-consulta/mutations/useDeleteTipoConsulta";
import { useUpdateTipoConsulta } from "@features/admin/modules/catalogos/tipos-consulta/mutations/useUpdateTipoConsulta";
import { useTiposConsultaList } from "@features/admin/modules/catalogos/tipos-consulta/queries/useTiposConsultaList";
import {
  buildTiposConsultaTableColumns,
  buildTiposConsultaVisibilityOptions,
} from "@features/admin/modules/catalogos/tipos-consulta/components/TiposConsultaTableColumns";
import { TipoConsultaCreateDialog } from "@features/admin/modules/catalogos/tipos-consulta/components/TipoConsultaCreateDialog";
import { TipoConsultaDetailsDialog } from "@features/admin/modules/catalogos/tipos-consulta/components/TipoConsultaDetailsDialog";
import { getTipoConsultaErrorMessage } from "@features/admin/modules/catalogos/tipos-consulta/utils/tipos-consulta.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { TipoConsultaListItem } from "@api/types";

const TIPO_CONSULTA_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type TipoConsultaStatusFilter =
  (typeof TIPO_CONSULTA_STATUS_FILTER)[keyof typeof TIPO_CONSULTA_STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function TiposConsultaPage() {
  const { hasCapability } = usePermissionDependencies();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TipoConsultaStatusFilter>(
    TIPO_CONSULTA_STATUS_FILTER.ALL,
  );
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      name: true,
      isActive: true,
      actions: true,
    });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tipoConsultaToDelete, setTipoConsultaToDelete] =
    useState<TipoConsultaListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedTipoConsulta,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<TipoConsultaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateTipoConsulta = useUpdateTipoConsulta();
  const deleteTipoConsulta = useDeleteTipoConsulta();

  const canReadTipoConsulta = hasCapability("admin.catalogs.tipos-consulta.read", {
    allOf: ["admin:catalogos:tipo_consulta:read"],
  });
  const canCreateTipoConsulta = hasCapability("admin.catalogs.tipos-consulta.create", {
    allOf: ["admin:catalogos:tipo_consulta:create"],
  });
  const canUpdateTipoConsulta = hasCapability("admin.catalogs.tipos-consulta.update", {
    allOf: ["admin:catalogos:tipo_consulta:update"],
  });
  const canDeleteTipoConsulta = hasCapability("admin.catalogs.tipos-consulta.delete", {
    allOf: ["admin:catalogos:tipo_consulta:delete"],
  });
  const readOnlyCatalogMessage =
    "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } = useTiposConsultaList(
    {
      page,
      pageSize,
      isActive:
        statusFilter === TIPO_CONSULTA_STATUS_FILTER.ALL
          ? undefined
          : statusFilter === TIPO_CONSULTA_STATUS_FILTER.ACTIVE,
    },
    {
      enabled: canReadTipoConsulta,
    },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((tipoConsulta) =>
          normalizeSearchValue(tipoConsulta.name).includes(normalizedSearch),
        );

  const showActions =
    canReadTipoConsulta || canUpdateTipoConsulta || canDeleteTipoConsulta;
  const isStatusPending = updateTipoConsulta.isPending;

  const handleToggleStatus = async (tipoConsulta: TipoConsultaListItem) => {
    const nextStatus = !tipoConsulta.isActive;

    try {
      await updateTipoConsulta.mutateAsync({
        id: tipoConsulta.id,
        data: { isActive: nextStatus },
      });
      toast.success(
        nextStatus ? "Tipo de consulta activado" : "Tipo de consulta desactivado",
      );
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoConsultaErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteTipoConsulta = async () => {
    if (!tipoConsultaToDelete) return;

    try {
      await deleteTipoConsulta.mutateAsync({ id: tipoConsultaToDelete.id });
      toast.success("Tipo de consulta eliminado", {
        description: `El tipo de consulta ${tipoConsultaToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setTipoConsultaToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getTipoConsultaErrorMessage(
          mutationError,
          "Error al eliminar tipo de consulta",
        ),
      });
    }
  };

  const columns = buildTiposConsultaTableColumns({
    canReadTipoConsulta,
    canUpdateTipoConsulta,
    canDeleteTipoConsulta,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (tipoConsulta) => {
      void handleToggleStatus(tipoConsulta);
    },
    onRequestDelete: (tipoConsulta) => {
      setTipoConsultaToDelete(tipoConsulta);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildTiposConsultaVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [
    statusFilter !== TIPO_CONSULTA_STATUS_FILTER.ALL,
  ].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadTipoConsulta &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadTipoConsulta && error
      ? getTipoConsultaErrorMessage(
          error,
          "No se pudo obtener el listado de tipos de consulta. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(TIPO_CONSULTA_STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-tipos-consulta",
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
      id: "export-tipos-consulta",
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
          id: TIPO_CONSULTA_STATUS_FILTER.ACTIVE,
          label: "Activos",
          selected: statusFilter === TIPO_CONSULTA_STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(TIPO_CONSULTA_STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: TIPO_CONSULTA_STATUS_FILTER.INACTIVE,
          label: "Inactivos",
          selected: statusFilter === TIPO_CONSULTA_STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(TIPO_CONSULTA_STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Tipos de consulta"
      description="Catalogo de clasificacion de consultas."
      icon={<ClipboardList className="size-12" />}
    >
      {!canReadTipoConsulta ? (
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
            disabled={!canReadTipoConsulta}
          />
        }
        actions={
          <>
            {canReadTipoConsulta ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadTipoConsulta ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadTipoConsulta ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateTipoConsulta ? (
              <TablePrimaryAction
                permission="admin:catalogos:tipo_consulta:create"
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
        isError={canReadTipoConsulta && Boolean(error)}
        errorTitle="No se pudo cargar tipos de consulta"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadTipoConsulta ? handleOpenDetails : undefined}
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
        emptyTitle="Sin tipos de consulta"
        emptyDescription="Cuando existan tipos de consulta registrados se listaran aqui."
      />

      <TipoConsultaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        tipoConsultaSummary={selectedTipoConsulta}
        canEdit={canUpdateTipoConsulta}
      />

      <TipoConsultaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setTipoConsultaToDelete(null);
          }
        }}
        title="Eliminar tipo de consulta"
        description="Esta accion dara de baja el tipo de consulta y lo quitara del catalogo."
        onConfirm={() => {
          void handleDeleteTipoConsulta();
        }}
        confirmDisabled={deleteTipoConsulta.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default TiposConsultaPage;
