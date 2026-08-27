import { useState } from "react";
import { toast } from "sonner";
import { Download, FlaskConical, Plus, RotateCcw } from "lucide-react";
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
import { useDeleteEstudioMedico } from "@features/admin/modules/catalogos/estudios-medicos/mutations/useDeleteEstudioMedico";
import { useUpdateEstudioMedico } from "@features/admin/modules/catalogos/estudios-medicos/mutations/useUpdateEstudioMedico";
import { useEstudiosMedicosList } from "@features/admin/modules/catalogos/estudios-medicos/queries/useEstudiosMedicosList";
import {
  buildEstudiosMedicosTableColumns,
  buildEstudiosMedicosVisibilityOptions,
} from "@features/admin/modules/catalogos/estudios-medicos/components/EstudiosMedicosTableColumns";
import { EstudioMedicoCreateDialog } from "@features/admin/modules/catalogos/estudios-medicos/components/EstudioMedicoCreateDialog";
import { EstudioMedicoDetailsDialog } from "@features/admin/modules/catalogos/estudios-medicos/components/EstudioMedicoDetailsDialog";
import { getEstudioMedicoErrorMessage } from "@features/admin/modules/catalogos/estudios-medicos/utils/estudios-medicos.feedback";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { EstudioMedicoListItem } from "@api/types";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

export function EstudiosMedicosPage() {
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
      studyType: true,
      precio: true,
      indication: true,
      groupType: true,
      providerId: true,
      isGeneral: true,
      isAuthorized: true,
      isActive: true,
      actions: true,
    });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [estudioMedicoToDelete, setEstudioMedicoToDelete] =
    useState<EstudioMedicoListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedEstudioMedico,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<EstudioMedicoListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateEstudioMedico = useUpdateEstudioMedico();
  const deleteEstudioMedico = useDeleteEstudioMedico();

  const canReadEstudioMedico = hasCapability(
    "admin.catalogs.estudiosMedicos.read",
    { allOf: ["admin:catalogos:estudios_med:read"] },
  );
  const canCreateEstudioMedico = hasCapability(
    "admin.catalogs.estudiosMedicos.create",
    { allOf: ["admin:catalogos:estudios_med:create"] },
  );
  const canUpdateEstudioMedico = hasCapability(
    "admin.catalogs.estudiosMedicos.update",
    { allOf: ["admin:catalogos:estudios_med:update"] },
  );
  const canDeleteEstudioMedico = hasCapability(
    "admin.catalogs.estudiosMedicos.delete",
    { allOf: ["admin:catalogos:estudios_med:delete"] },
  );
  const readOnlyCatalogMessage =
    "No tienes acceso para consultar este catalogo.";

  const { data, isLoading, isFetching, error, refetch } =
    useEstudiosMedicosList(
      {
        page,
        pageSize,
        isActive:
          statusFilter === STATUS_FILTER.ALL
            ? undefined
            : statusFilter === STATUS_FILTER.ACTIVE,
      },
      { enabled: canReadEstudioMedico },
    );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((estudioMedico) => {
          const matchesName = normalizeSearchValue(
            estudioMedico.name,
          ).includes(normalizedSearch);
          const matchesStudyType = normalizeSearchValue(
            estudioMedico.studyType,
          ).includes(normalizedSearch);
          return matchesName || matchesStudyType;
        });

  const showActions =
    canReadEstudioMedico || canUpdateEstudioMedico || canDeleteEstudioMedico;
  const isStatusPending = updateEstudioMedico.isPending;

  const handleToggleStatus = async (estudioMedico: EstudioMedicoListItem) => {
    const nextStatus = !estudioMedico.isActive;

    try {
      await updateEstudioMedico.mutateAsync({
        id: estudioMedico.id,
        data: { isActive: nextStatus },
      });
      toast.success(
        nextStatus ? "Estudio medico activado" : "Estudio medico desactivado",
      );
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getEstudioMedicoErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteEstudioMedico = async () => {
    if (!estudioMedicoToDelete) return;

    try {
      await deleteEstudioMedico.mutateAsync({ id: estudioMedicoToDelete.id });
      toast.success("Estudio medico eliminado", {
        description: `El estudio ${estudioMedicoToDelete.name} se elimino correctamente.`,
      });
      setDeleteOpen(false);
      setEstudioMedicoToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getEstudioMedicoErrorMessage(
          mutationError,
          "Error al eliminar estudio medico",
        ),
      });
    }
  };

  const columns = buildEstudiosMedicosTableColumns({
    canReadEstudioMedico,
    canUpdateEstudioMedico,
    canDeleteEstudioMedico,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (estudioMedico) => {
      void handleToggleStatus(estudioMedico);
    },
    onRequestDelete: (estudioMedico) => {
      setEstudioMedicoToDelete(estudioMedico);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildEstudiosMedicosVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(
    Boolean,
  ).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadEstudioMedico &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadEstudioMedico && error
      ? getEstudioMedicoErrorMessage(
          error,
          "No se pudo obtener el listado de estudios medicos. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-estudios-medicos",
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
      id: "export-estudios-medicos",
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
      title="Estudios medicos"
      description="Catalogo de estudios medicos y auxiliares."
      icon={<FlaskConical className="size-12" />}
    >
      {!canReadEstudioMedico ? (
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
            disabled={!canReadEstudioMedico}
          />
        }
        actions={
          <>
            {canReadEstudioMedico ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadEstudioMedico ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadEstudioMedico ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateEstudioMedico ? (
              <TablePrimaryAction
                permission="admin:catalogos:estudios_med:create"
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
        isError={canReadEstudioMedico && Boolean(error)}
        errorTitle="No se pudo cargar estudios medicos"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadEstudioMedico ? handleOpenDetails : undefined}
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
        emptyTitle="Sin estudios medicos"
        emptyDescription="Cuando existan estudios medicos registrados se listaran aqui."
      />

      <EstudioMedicoDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        estudioMedicoSummary={selectedEstudioMedico}
        canEdit={canUpdateEstudioMedico}
      />

      <EstudioMedicoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setEstudioMedicoToDelete(null);
          }
        }}
        title="Eliminar estudio medico"
        description="Esta accion dara de baja el estudio medico y lo quitara del catalogo."
        onConfirm={() => {
          void handleDeleteEstudioMedico();
        }}
        confirmDisabled={deleteEstudioMedico.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default EstudiosMedicosPage;
