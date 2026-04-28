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
import { useDeleteEspecialidad } from "@features/admin/modules/catalogos/especialidades/mutations/useDeleteEspecialidad";
import { useUpdateEspecialidad } from "@features/admin/modules/catalogos/especialidades/mutations/useUpdateEspecialidad";
import { useEspecialidadesList } from "@features/admin/modules/catalogos/especialidades/queries/useEspecialidadesList";
import {
  buildEspecialidadesTableColumns,
  buildEspecialidadesVisibilityOptions,
} from "@features/admin/modules/catalogos/especialidades/components/EspecialidadesTableColumns";
import { EspecialidadCreateDialog } from "@features/admin/modules/catalogos/especialidades/components/EspecialidadCreateDialog";
import { EspecialidadDetailsDialog } from "@features/admin/modules/catalogos/especialidades/components/EspecialidadDetailsDialog";
import { getEspecialidadErrorMessage } from "@features/admin/modules/catalogos/especialidades/utils/especialidades.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { EspecialidadListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function EspecialidadesPage() {
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
  const [especialidadToDelete, setEspecialidadToDelete] =
    useState<EspecialidadListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedEspecialidad,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<EspecialidadListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateEspecialidad = useUpdateEspecialidad();
  const deleteEspecialidad = useDeleteEspecialidad();

  const canReadEspecialidad = hasCapability(
    "admin.catalogs.especialidades.read",
    { allOf: ["admin:catalogos:especialidades:read"] },
  );
  const canCreateEspecialidad = hasCapability(
    "admin.catalogs.especialidades.create",
    { allOf: ["admin:catalogos:especialidades:create"] },
  );
  const canUpdateEspecialidad = hasCapability(
    "admin.catalogs.especialidades.update",
    { allOf: ["admin:catalogos:especialidades:update"] },
  );
  const canDeleteEspecialidad = hasCapability(
    "admin.catalogs.especialidades.delete",
    { allOf: ["admin:catalogos:especialidades:delete"] },
  );

  const { data, isLoading, isFetching, error, refetch } =
    useEspecialidadesList(
      {
        page,
        pageSize,
        isActive:
          statusFilter === STATUS_FILTER.ALL
            ? undefined
            : statusFilter === STATUS_FILTER.ACTIVE,
      },
      { enabled: canReadEspecialidad },
    );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((especialidad) =>
          normalizeSearchValue(especialidad.name).includes(normalizedSearch),
        );

  const showActions =
    canReadEspecialidad || canUpdateEspecialidad || canDeleteEspecialidad;
  const isStatusPending = updateEspecialidad.isPending;

  const handleToggleStatus = async (especialidad: EspecialidadListItem) => {
    const nextStatus = !especialidad.isActive;

    try {
      await updateEspecialidad.mutateAsync({
        id: especialidad.id,
        data: { isActive: nextStatus },
      });
      toast.success(
        nextStatus ? "Especialidad activada" : "Especialidad desactivada",
      );
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getEspecialidadErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteEspecialidad = async () => {
    if (!especialidadToDelete) return;

    try {
      await deleteEspecialidad.mutateAsync({ id: especialidadToDelete.id });
      toast.success("Especialidad eliminada", {
        description: `La especialidad ${especialidadToDelete.name} se eliminó correctamente.`,
      });
      setDeleteOpen(false);
      setEspecialidadToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getEspecialidadErrorMessage(
          mutationError,
          "Error al eliminar especialidad",
        ),
      });
    }
  };

  const columns = buildEspecialidadesTableColumns({
    canReadEspecialidad,
    canUpdateEspecialidad,
    canDeleteEspecialidad,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (especialidad) => {
      void handleToggleStatus(especialidad);
    },
    onRequestDelete: (especialidad) => {
      setEspecialidadToDelete(especialidad);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildEspecialidadesVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(
    Boolean,
  ).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadEspecialidad &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadEspecialidad && error
      ? getEspecialidadErrorMessage(
          error,
          "No se pudo obtener el listado de especialidades. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-especialidades",
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
      id: "export-especialidades",
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
      title="Especialidades"
      description="Catálogo de especialidades médicas del sistema."
      icon={<Stethoscope className="size-12" />}
    >
      {!canReadEspecialidad ? (
        <AdminReadOnlyNotice message="No tienes acceso para consultar este catálogo." />
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
            disabled={!canReadEspecialidad}
          />
        }
        actions={
          <>
            {canReadEspecialidad ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadEspecialidad ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadEspecialidad ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateEspecialidad ? (
              <TablePrimaryAction
                permission="admin:catalogos:especialidades:create"
                dependencyAware
                label="Nueva"
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
        isError={canReadEspecialidad && Boolean(error)}
        errorTitle="No se pudo cargar especialidades"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadEspecialidad ? handleOpenDetails : undefined}
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
        emptyTitle="Sin especialidades"
        emptyDescription="Cuando existan especialidades registradas se listarán aquí."
      />

      <EspecialidadDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        especialidadSummary={selectedEspecialidad}
        canEdit={canUpdateEspecialidad}
      />

      <EspecialidadCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setEspecialidadToDelete(null);
          }
        }}
        title="Eliminar especialidad"
        description="Esta acción dará de baja la especialidad y la quitará del catálogo."
        onConfirm={() => {
          void handleDeleteEspecialidad();
        }}
        confirmDisabled={deleteEspecialidad.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default EspecialidadesPage;
