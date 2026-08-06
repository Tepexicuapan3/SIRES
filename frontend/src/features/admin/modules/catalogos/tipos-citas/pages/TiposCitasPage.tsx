import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Download, Plus, RotateCcw } from "lucide-react";
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
import { useDeleteTipoCita } from "@features/admin/modules/catalogos/tipos-citas/mutations/useDeleteTipoCita";
import { useUpdateTipoCita } from "@features/admin/modules/catalogos/tipos-citas/mutations/useUpdateTipoCita";
import { useTiposCitasList } from "@features/admin/modules/catalogos/tipos-citas/queries/useTiposCitasList";
import {
  buildTiposCitasTableColumns,
  buildTiposCitasVisibilityOptions,
} from "@features/admin/modules/catalogos/tipos-citas/components/TiposCitasTableColumns";
import { TipoCitaCreateDialog } from "@features/admin/modules/catalogos/tipos-citas/components/TipoCitaCreateDialog";
import { TipoCitaDetailsDialog } from "@features/admin/modules/catalogos/tipos-citas/components/TipoCitaDetailsDialog";
import { getTipoCitaErrorMessage } from "@features/admin/modules/catalogos/tipos-citas/utils/tipos-citas.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { TipoCitaListItem } from "@api/types";

const TIPO_CITA_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type TipoCitaStatusFilter =
  (typeof TIPO_CITA_STATUS_FILTER)[keyof typeof TIPO_CITA_STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function TiposCitasPage() {
  const { hasCapability } = usePermissionDependencies();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TipoCitaStatusFilter>(
    TIPO_CITA_STATUS_FILTER.ALL,
  );
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      name: true,
      isActive: true,
      actions: true,
    });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tipoCitaToDelete, setTipoCitaToDelete] =
    useState<TipoCitaListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedTipoCita,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<TipoCitaListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateTipoCita = useUpdateTipoCita();
  const deleteTipoCita = useDeleteTipoCita();

  const canReadTipoCita = hasCapability("admin.catalogs.tipos-citas.read", {
    allOf: ["admin:catalogos:tipo_citas:read"],
  });
  const canCreateTipoCita = hasCapability("admin.catalogs.tipos-citas.create", {
    allOf: ["admin:catalogos:tipo_citas:create"],
  });
  const canUpdateTipoCita = hasCapability("admin.catalogs.tipos-citas.update", {
    allOf: ["admin:catalogos:tipo_citas:update"],
  });
  const canDeleteTipoCita = hasCapability("admin.catalogs.tipos-citas.delete", {
    allOf: ["admin:catalogos:tipo_citas:delete"],
  });
  const readOnlyCatalogMessage =
    "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } = useTiposCitasList(
    {
      page,
      pageSize,
      isActive:
        statusFilter === TIPO_CITA_STATUS_FILTER.ALL
          ? undefined
          : statusFilter === TIPO_CITA_STATUS_FILTER.ACTIVE,
    },
    {
      enabled: canReadTipoCita,
    },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((tipoCita) =>
          normalizeSearchValue(tipoCita.name).includes(normalizedSearch),
        );

  const showActions = canReadTipoCita || canUpdateTipoCita || canDeleteTipoCita;
  const isStatusPending = updateTipoCita.isPending;

  const handleToggleStatus = async (tipoCita: TipoCitaListItem) => {
    const nextStatus = !tipoCita.isActive;

    try {
      await updateTipoCita.mutateAsync({
        id: tipoCita.id,
        data: { isActive: nextStatus },
      });
      toast.success(
        nextStatus ? "Tipo de cita activado" : "Tipo de cita desactivado",
      );
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getTipoCitaErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteTipoCita = async () => {
    if (!tipoCitaToDelete) return;

    try {
      await deleteTipoCita.mutateAsync({ id: tipoCitaToDelete.id });
      toast.success("Tipo de cita eliminado", {
        description: `El tipo de cita ${tipoCitaToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setTipoCitaToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getTipoCitaErrorMessage(
          mutationError,
          "Error al eliminar tipo de cita",
        ),
      });
    }
  };

  const columns = buildTiposCitasTableColumns({
    canReadTipoCita,
    canUpdateTipoCita,
    canDeleteTipoCita,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (tipoCita) => {
      void handleToggleStatus(tipoCita);
    },
    onRequestDelete: (tipoCita) => {
      setTipoCitaToDelete(tipoCita);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildTiposCitasVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [
    statusFilter !== TIPO_CITA_STATUS_FILTER.ALL,
  ].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadTipoCita &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadTipoCita && error
      ? getTipoCitaErrorMessage(
          error,
          "No se pudo obtener el listado de tipos de cita. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(TIPO_CITA_STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-tipos-citas",
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
      id: "export-tipos-citas",
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
          id: TIPO_CITA_STATUS_FILTER.ACTIVE,
          label: "Activos",
          selected: statusFilter === TIPO_CITA_STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(TIPO_CITA_STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: TIPO_CITA_STATUS_FILTER.INACTIVE,
          label: "Inactivos",
          selected: statusFilter === TIPO_CITA_STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(TIPO_CITA_STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Tipos de citas"
      description="Catalogo de clasificacion de citas."
      icon={<CalendarClock className="size-12" />}
    >
      {!canReadTipoCita ? (
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
            disabled={!canReadTipoCita}
          />
        }
        actions={
          <>
            {canReadTipoCita ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadTipoCita ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadTipoCita ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateTipoCita ? (
              <TablePrimaryAction
                permission="admin:catalogos:tipo_citas:create"
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
        isError={canReadTipoCita && Boolean(error)}
        errorTitle="No se pudo cargar tipos de cita"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadTipoCita ? handleOpenDetails : undefined}
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
        emptyTitle="Sin tipos de cita"
        emptyDescription="Cuando existan tipos de cita registrados se listaran aqui."
      />

      <TipoCitaDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        tipoCitaSummary={selectedTipoCita}
        canEdit={canUpdateTipoCita}
      />

      <TipoCitaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setTipoCitaToDelete(null);
          }
        }}
        title="Eliminar tipo de cita"
        description="Esta accion dara de baja el tipo de cita y lo quitara del catalogo."
        onConfirm={() => {
          void handleDeleteTipoCita();
        }}
        confirmDisabled={deleteTipoCita.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default TiposCitasPage;
