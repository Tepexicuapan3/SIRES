import { useState } from "react";
import { toast } from "sonner";
import { Bell, Plus, RotateCcw } from "lucide-react";
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
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { useAnunciosList } from "@features/comunicados/modules/anuncios/queries/useAnunciosList";
import { useUpdateAnuncio } from "@features/comunicados/modules/anuncios/mutations/useUpdateAnuncio";
import { useDeleteAnuncio } from "@features/comunicados/modules/anuncios/mutations/useDeleteAnuncio";
import {
  buildAnunciosTableColumns,
  buildAnunciosVisibilityOptions,
} from "@features/comunicados/modules/anuncios/components/AnunciosTableColumns";
import { AnuncioCreateDialog } from "@features/comunicados/modules/anuncios/components/AnuncioCreateDialog";
import { AnuncioDetailsDialog } from "@features/comunicados/modules/anuncios/components/AnuncioDetailsDialog";
import { getAnuncioErrorMessage } from "@features/comunicados/modules/anuncios/utils/anuncios.feedback";
import type { AnuncioListItem } from "@features/comunicados/modules/anuncios/domain/anuncios.schemas";

const STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusFilter = (typeof STATUS_FILTER)[keyof typeof STATUS_FILTER];

export function AnunciosPage() {
  const { hasCapability } = usePermissionDependencies();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    STATUS_FILTER.ALL,
  );
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>({
      imagenUrl: true,
      titulo: true,
      vigencia: true,
      orden: true,
      activo: true,
      actions: true,
    });
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [anuncioToDelete, setAnuncioToDelete] =
    useState<AnuncioListItem | null>(null);

  const {
    open: detailsOpen,
    selectedItem: selectedAnuncio,
    openDetails: handleOpenDetails,
    closeDetails: handleCloseDetails,
    setOpen: setDetailsOpen,
  } = useTableDetailsDialog<AnuncioListItem>();

  const debouncedSearch = useDebounce(search, 400);
  const updateAnuncio = useUpdateAnuncio();
  const deleteAnuncio = useDeleteAnuncio();

  const canReadAnuncio = hasCapability("comunicados.anuncios.read", {
    allOf: ["comunicados:anuncios:read"],
  });
  const canCreateAnuncio = hasCapability("comunicados.anuncios.create", {
    allOf: ["comunicados:anuncios:create"],
  });
  const canUpdateAnuncio = hasCapability("comunicados.anuncios.update", {
    allOf: ["comunicados:anuncios:update"],
  });
  const canDeleteAnuncio = hasCapability("comunicados.anuncios.delete", {
    allOf: ["comunicados:anuncios:delete"],
  });

  const { data, isLoading, isFetching, error, refetch } = useAnunciosList(
    {
      page,
      pageSize,
      search: debouncedSearch.trim() || undefined,
      activo:
        statusFilter === STATUS_FILTER.ALL
          ? undefined
          : statusFilter === STATUS_FILTER.ACTIVE,
    },
    { enabled: canReadAnuncio },
  );

  const rows = data?.items ?? [];
  const showActions = canReadAnuncio || canUpdateAnuncio || canDeleteAnuncio;
  const isStatusPending = updateAnuncio.isPending;

  const handleToggleStatus = async (anuncio: AnuncioListItem) => {
    const nextStatus = !anuncio.activo;

    try {
      await updateAnuncio.mutateAsync({
        id: anuncio.id,
        data: { activo: nextStatus },
      });
      toast.success(nextStatus ? "Anuncio activado" : "Anuncio desactivado");
    } catch (mutationError) {
      toast.error("No se pudo actualizar el estado", {
        description: getAnuncioErrorMessage(
          mutationError,
          "Error al actualizar estado",
        ),
      });
    }
  };

  const handleDeleteAnuncio = async () => {
    if (!anuncioToDelete) return;

    try {
      await deleteAnuncio.mutateAsync({ id: anuncioToDelete.id });
      toast.success("Anuncio eliminado", {
        description: `El anuncio "${anuncioToDelete.titulo}" se eliminó correctamente.`,
      });
      setDeleteOpen(false);
      setAnuncioToDelete(null);
    } catch (mutationError) {
      toast.error("No se pudo eliminar", {
        description: getAnuncioErrorMessage(
          mutationError,
          "Error al eliminar anuncio",
        ),
      });
    }
  };

  const columns = buildAnunciosTableColumns({
    canReadAnuncio,
    canUpdateAnuncio,
    canDeleteAnuncio,
    isStatusPending,
    onOpenDetails: handleOpenDetails,
    onToggleStatus: (anuncio) => {
      void handleToggleStatus(anuncio);
    },
    onRequestDelete: (anuncio) => {
      setAnuncioToDelete(anuncio);
      setDeleteOpen(true);
    },
  });
  const visibilityOptions = buildAnunciosVisibilityOptions(showActions);

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [statusFilter !== STATUS_FILTER.ALL].filter(
    Boolean,
  ).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadAnuncio &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadAnuncio && error
      ? getAnuncioErrorMessage(
          error,
          "No se pudo obtener el listado de anuncios. Intenta nuevamente.",
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh-anuncios",
      label: "Actualizar",
      icon: RotateCcw,
      isLoading: isFetching,
      disabled: isFetching,
      onSelect: () => {
        if (isFetching) return;
        void refetch();
      },
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
      title="Anuncios"
      description="Banner de anuncios y flyers que se muestra en el portal de citas."
      icon={<Bell className="size-12" />}
    >
      {!canReadAnuncio ? (
        <AdminReadOnlyNotice message="No tienes acceso para consultar los anuncios." />
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
            disabled={!canReadAnuncio}
          />
        }
        actions={
          <>
            {canReadAnuncio ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadAnuncio ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadAnuncio ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
            {canCreateAnuncio ? (
              <TablePrimaryAction
                permission="comunicados:anuncios:create"
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
        isError={canReadAnuncio && Boolean(error)}
        errorTitle="No se pudo cargar anuncios"
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
        onRowClick={canReadAnuncio ? handleOpenDetails : undefined}
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
        emptyTitle="Sin anuncios"
        emptyDescription="Cuando existan anuncios registrados se listarán aquí."
      />

      <AnuncioDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onClose={handleCloseDetails}
        anuncioSummary={selectedAnuncio}
        canEdit={canUpdateAnuncio}
      />

      <AnuncioCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDestructiveDialog
        open={deleteOpen}
        onOpenChange={(nextOpen) => {
          setDeleteOpen(nextOpen);
          if (!nextOpen) {
            setAnuncioToDelete(null);
          }
        }}
        title="Eliminar anuncio"
        description="Esta acción dará de baja el anuncio y dejará de mostrarse en el portal de citas."
        onConfirm={() => {
          void handleDeleteAnuncio();
        }}
        confirmDisabled={deleteAnuncio.isPending}
      />
    </CatalogModuleLayout>
  );
}

export default AnunciosPage;
