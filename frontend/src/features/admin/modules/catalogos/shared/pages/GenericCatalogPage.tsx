import { useState } from "react";
import { BookOpen, Download, RotateCcw } from "lucide-react";
import { useDebounce } from "@shared/hooks/useDebounce";
import {
  DataTable,
  type DataTableColumn,
} from "@features/admin/shared/components/DataTable";
import {
  TableColumnVisibility,
  type ColumnVisibilityState,
  type TableColumnVisibilityItem,
} from "@features/admin/shared/components/TableColumnVisibility";
import { TableFilterMenu } from "@features/admin/shared/components/TableFilterMenu";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import {
  TableOptionsMenu,
  type TableOptionItem,
} from "@features/admin/shared/components/TableOptionsMenu";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { CatalogStatusBadge } from "@features/admin/modules/catalogos/shared/components/CatalogStatusBadge";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { type CatalogDefinition } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";
import { getCatalogErrorMessage } from "@features/admin/modules/catalogos/shared/utils/catalog-feedback";
import { useCatalogList } from "@features/admin/modules/catalogos/shared/queries/useCatalogList";
import { AdminReadOnlyNotice } from "@features/admin/shared/components/AdminReadOnlyNotice";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import type { GenericCatalogListItem } from "@api/types/catalogos/generic-catalog.types";

const CATALOG_STATUS_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

const CATALOG_ERROR_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED: "No tienes permiso para consultar este catalogo.",
  SESSION_EXPIRED: "Tu sesion expiro. Inicia sesion nuevamente.",
  VALIDATION_ERROR: "No se pudieron validar los parametros de consulta.",
  NETWORK_ERROR: "No hay conexion con el servidor. Intenta nuevamente.",
};

type CatalogStatusFilter =
  (typeof CATALOG_STATUS_FILTER)[keyof typeof CATALOG_STATUS_FILTER];

const normalizeSearchValue = (value: string | number | null | undefined) =>
  String(value ?? "").toLowerCase();

interface GenericCatalogPageProps {
  catalog: CatalogDefinition;
}

export function GenericCatalogPage({ catalog }: GenericCatalogPageProps) {
  const { hasCapability } = usePermissionDependencies();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CatalogStatusFilter>(
    CATALOG_STATUS_FILTER.ALL,
  );
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>(() => ({
      name: true,
      code: catalog.hasCodeColumn ?? false,
      isActive: true,
    }));

  const debouncedSearch = useDebounce(search, 400);

  const canReadCatalog = hasCapability(`admin.catalogs.${catalog.slug}.read`, {
    allOf: [catalog.permissionRead],
  });

  const { data, isLoading, isFetching, error, refetch } = useCatalogList(
    catalog.endpoint,
    {
      page,
      pageSize,
      isActive:
        statusFilter === CATALOG_STATUS_FILTER.ALL
          ? undefined
          : statusFilter === CATALOG_STATUS_FILTER.ACTIVE,
    },
    {
      enabled: canReadCatalog,
    },
  );

  const allRows = data?.items ?? [];
  const normalizedSearch = debouncedSearch.trim().toLowerCase();
  const rows =
    normalizedSearch.length === 0
      ? allRows
      : allRows.filter((row) => {
          const matchesName = normalizeSearchValue(row.name).includes(
            normalizedSearch,
          );
          const matchesCode = normalizeSearchValue(row.code).includes(
            normalizedSearch,
          );
          const matchesId = normalizeSearchValue(row.id).includes(
            normalizedSearch,
          );
          return matchesName || matchesCode || matchesId;
        });

  const columns: DataTableColumn<GenericCatalogListItem>[] = [
    {
      key: "name",
      header: "Nombre",
      accessorKey: "name",
      className: "w-[320px]",
      cellContentClassName: "max-w-[320px]",
    },
    {
      key: "isActive",
      header: "Estado",
      align: "center",
      accessorKey: "isActive",
      className: "w-[150px]",
      render: (row) => (
        <CatalogStatusBadge
          isActive={row.isActive}
          activeLabel="Activa"
          inactiveLabel="Inactiva"
        />
      ),
    },
  ];

  if (catalog.hasCodeColumn) {
    columns.splice(1, 0, {
      key: "code",
      header: "Codigo",
      align: "left",
      className: "w-[180px]",
      render: (row) => (row.code ? String(row.code) : "-"),
    });
  }

  const visibilityOptions: TableColumnVisibilityItem[] = [
    { key: "name", label: "Nombre" },
    ...(catalog.hasCodeColumn ? [{ key: "code", label: "Codigo" }] : []),
    { key: "isActive", label: "Estado" },
  ];

  const visibleColumns = columns.filter(
    (column) => columnVisibility[column.key] ?? true,
  );

  const appliedFiltersCount = [
    statusFilter !== CATALOG_STATUS_FILTER.ALL,
  ].filter(Boolean).length;

  const isSearchPending = search.trim() !== debouncedSearch.trim();
  const hasFilters =
    canReadCatalog &&
    (Boolean(debouncedSearch.trim()) || appliedFiltersCount > 0);
  const tableErrorDescription =
    canReadCatalog && error
      ? getCatalogErrorMessage(
          error,
          `No se pudo obtener el listado de ${catalog.title.toLowerCase()}. Intenta nuevamente.`,
          CATALOG_ERROR_MESSAGES,
        )
      : undefined;

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter(CATALOG_STATUS_FILTER.ALL);
    setPage(1);
  };

  const tableOptions: TableOptionItem[] = [
    {
      id: `refresh-${catalog.slug}`,
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
      id: `export-${catalog.slug}`,
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
          id: CATALOG_STATUS_FILTER.ACTIVE,
          label: "Activas",
          selected: statusFilter === CATALOG_STATUS_FILTER.ACTIVE,
          onSelect: () => {
            setStatusFilter(CATALOG_STATUS_FILTER.ACTIVE);
            setPage(1);
          },
        },
        {
          id: CATALOG_STATUS_FILTER.INACTIVE,
          label: "Inactivas",
          selected: statusFilter === CATALOG_STATUS_FILTER.INACTIVE,
          onSelect: () => {
            setStatusFilter(CATALOG_STATUS_FILTER.INACTIVE);
            setPage(1);
          },
        },
      ],
    },
  ];

  return (
    <CatalogModuleLayout
      title={catalog.title}
      description={catalog.description}
      icon={<BookOpen className="size-12" />}
    >
      {!canReadCatalog ? (
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
            placeholder="Buscar en la tabla"
            disabled={!canReadCatalog}
          />
        }
        actions={
          <>
            {canReadCatalog ? (
              <TableFilterMenu
                sections={filterSections}
                appliedCount={appliedFiltersCount}
                onClear={handleClearFilters}
              />
            ) : null}
            {canReadCatalog ? (
              <TableColumnVisibility
                columns={visibilityOptions}
                visibility={columnVisibility}
                onVisibilityChange={setColumnVisibility}
              />
            ) : null}
            {canReadCatalog ? (
              <TableOptionsMenu options={tableOptions} />
            ) : null}
          </>
        }
      />

      <DataTable
        columns={visibleColumns}
        rows={rows}
        isLoading={isLoading || isSearchPending}
        isError={canReadCatalog && Boolean(error)}
        errorTitle={`No se pudo cargar ${catalog.title.toLowerCase()}`}
        errorDescription={tableErrorDescription}
        hasFilters={hasFilters}
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
        emptyTitle={`Sin ${catalog.title.toLowerCase()}`}
        emptyDescription={`Cuando existan registros en ${catalog.title.toLowerCase()} se listaran aqui.`}
      />
    </CatalogModuleLayout>
  );
}

export default GenericCatalogPage;
