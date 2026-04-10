import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RotateCcw, Stethoscope } from "lucide-react";
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
import { useDeleteConsultorio } from "@features/admin/modules/catalogos/consultorios/mutations/useDeleteConsultorio";
import { useUpdateConsultorio } from "@features/admin/modules/catalogos/consultorios/mutations/useUpdateConsultorio";
import { useConsultoriosList } from "@features/admin/modules/catalogos/consultorios/queries/useConsultoriosList";
import {
  buildConsultoriosTableColumns,
  buildConsultoriosVisibilityOptions,
} from "@features/admin/modules/catalogos/consultorios/components/ConsultoriosTableColumns";
import { ConsultorioCreateDialog } from "@features/admin/modules/catalogos/consultorios/components/ConsultorioCreateDialog";
import { ConsultorioDetailsDialog } from "@features/admin/modules/catalogos/consultorios/components/ConsultorioDetailsDialog";
import { getConsultorioErrorMessage } from "@features/admin/modules/catalogos/consultorios/utils/consultorios.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { ConsultorioListItem } from "@api/types";

const CONSULTORIO_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type ConsultorioStatusFilter =
  (typeof CONSULTORIO_STATUS_FILTER)[keyof typeof CONSULTORIO_STATUS_FILTER];

export function ConsultoriosPage() {
  const { hasEffectivePermission } = usePermissionDependencies();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ConsultorioStatusFilter>(
    CONSULTORIO_STATUS_FILTER.ALL,
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
  const [consultorioToDelete, setConsultorioToDelete] =
    useState<ConsultorioListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedConsultorio,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<ConsultorioListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateConsultorio = useUpdateConsultorio();
  const deleteConsultorio = useDeleteConsultorio();

  const canReadConsultorio = hasEffectivePermission(
    "admin:catalogos:consultorios:read",
  );
  const canCreateConsultorio = hasEffectivePermission(
    "admin:catalogos:consultorios:create",
  );
  const canUpdateConsultorio = hasEffectivePermission(
    "admin:catalogos:consultorios:update",
  );
  const canDeleteConsultorio = hasEffectivePermission(
    "admin:catalogos:consultorios:delete",
  );
  const readOnlyCatalogMessage =
    "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } = useConsultoriosList(
    {
      page,
      pageSize,
      search: debouncedSearch.trim() || undefined,
      isActive:
        statusFilter === CONSULTORIO_STATUS_FILTER.ALL
          ? undefined
          : statusFilter === CONSULTORIO_STATUS_FILTER.ACTIVE,
    },
    {
      enabled: canReadConsultorio,
    },
  );

  const rows = data?.items ?? [];

  const showActions =
    canReadConsultorio || canUpdateConsultorio || canDeleteConsultorio;
  const isStatusPending = updateConsultorio.isPending;

  const handleToggleStatus = async (consultorio: ConsultorioListItem) => {
    const nextStatus = !consultorio.isActive;

    try {
      await updateConsultorio.mutateAsync({
        consultorioId: consultorio.id,
        data: { isActive: nextStatus },
      });

      toast.success(
        nextStatus ? "Consultorio activado" : "Consultorio desactivado",
      );
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getConsultorioErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteConsultorio = async () => {
    if (!consultorioToDelete) return;

    try {
      await deleteConsultorio.mutateAsync({
        consultorioId: consultorioToDelete.id,
      });
      toast.success("Consultorio eliminado", {
        description: `El consultorio ${consultorioToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setConsultorioToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getConsultorioErrorMessage(
          mutationError,
          "Error al eliminar consultorio",
        ),
      });
    }
  };

  const columns = buildConsultoriosTableColumns({
    canReadConsultorio,
    canUpdateConsultorio,
    canDeleteConsultorio,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (consultorio) => {
      void handleToggleStatus(consultorio);
    },
    onRequestDelete: (consultorio) => {
      setConsultorioToDelete(consultorio);
      setDeleteOpen(true);
    },
  });

  const visibilityOptions = buildConsultoriosVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [
    statusFilter !== CONSULTORIO_STATUS_FILTER.ALL,
  ].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadConsultorio &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadConsultorio && error
      ? getConsultorioErrorMessage(
          error,
          "No se pudo obtener el listado de consultorios. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(CONSULTORIO_STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-consultorios",
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
      id: "export-consultorios",
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
          id: CONSULTORIO_STATUS_FILTER.ACTIVE,
          label: "Activos",
          selected: statusFilter === CONSULTORIO_STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(CONSULTORIO_STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: CONSULTORIO_STATUS_FILTER.INACTIVE,
          label: "Inactivos",
          selected: statusFilter === CONSULTORIO_STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(CONSULTORIO_STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title="Consultorios"
      description="Catalogo base de consultorios disponibles por centro de atencion."
      icon={<Stethoscope className="size-12" />}
    >
      {!canReadConsultorio ? (
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
            disabled={!canReadConsultorio}
          />
        }
        actions={
          <>
            {canReadConsultorio ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadConsultorio ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadConsultorio ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateConsultorio ? (
              <TablePrimaryAction
                permission="admin:catalogos:consultorios:create"
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
        isError={canReadConsultorio && Boolean(error)}
        errorTitle="No se pudo cargar consultorios"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadConsultorio ? handleOpenDetails : undefined}
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
        emptyTitle="Sin consultorios"
        emptyDescription="Cuando existan consultorios registrados se listaran aqui."
      />

      <ConsultorioDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        consultorioSummary={selectedConsultorio}
        canEdit={canUpdateConsultorio}
      />

      <ConsultorioCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setConsultorioToDelete(null);
          }
        }}
        title="Eliminar consultorio"
        description="Esta accion dara de baja el consultorio y lo quitara del catalogo."
        onConfirm={() => {
          void handleDeleteConsultorio();
        }}
        confirmDisabled={deleteConsultorio.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default ConsultoriosPage;
