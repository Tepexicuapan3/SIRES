import { useState } from "react";
import { Boxes, RotateCcw, AlertTriangle } from "lucide-react";
import { useDebounce } from "@shared/hooks/useDebounce";
import { DataTable } from "@features/admin/shared/components/DataTable";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { TableOptionsMenu, type TableOptionItem } from "@features/admin/shared/components/TableOptionsMenu";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { useExistenciasList } from "../queries/useKardexQueries";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";

export function ExistenciasPage() {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch]     = useState("");
  const [soloBajoCritico, setSoloBajoCritico] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, error, refetch } = useExistenciasList({
    page, pageSize,
    search:          debouncedSearch.trim() || undefined,
    soloBajoCritico: soloBajoCritico || undefined,
  });

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh", label: "Actualizar", icon: RotateCcw, isLoading: isFetching,
      disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); },
    },
  ];

  return (
    <CatalogModuleLayout
      title="Existencias"
      description="Saldos actuales de insumos por almacén y lote."
      icon={<Boxes className="size-12" />}
    >
      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Buscar insumo o código"
          />
        }
        actions={
          <>
            <Button
              size="sm"
              variant={soloBajoCritico ? "default" : "outline"}
              onClick={() => { setSoloBajoCritico((v) => !v); setPage(1); }}
            >
              <AlertTriangle className="size-3 mr-1" />
              Bajo mínimo
            </Button>
            <TableOptionsMenu options={tableOptions} />
          </>
        }
      />

      <DataTable
        columns={[
          {
            key: "insumoCode", header: "Código", className: "w-28",
            render: (row) => <span className="font-mono text-xs">{row.insumoCode}</span>,
          },
          {
            key: "insumoNombre", header: "Insumo",
            render: (row) => (
              <span className="font-medium flex items-center gap-1">
                {row.bajoCritico && <AlertTriangle className="size-3 text-destructive" />}
                {row.insumoNombre}
              </span>
            ),
          },
          {
            key: "almacenNombre", header: "Almacén",
            render: (row) => row.almacenNombre,
          },
          {
            key: "numLote", header: "Lote", className: "w-28",
            render: (row) => <span className="font-mono text-xs">{row.numLote || "—"}</span>,
          },
          {
            key: "caducidad", header: "Caducidad", className: "w-28",
            render: (row) => row.caducidad || <span className="text-muted-foreground text-xs">—</span>,
          },
          {
            key: "cantidad", header: "Existencia", className: "w-24",
            render: (row) => (
              <span className={`tabular-nums font-semibold ${row.bajoCritico ? "text-destructive" : ""}`}>
                {Math.round(Number(row.cantidad))}
              </span>
            ),
          },
          {
            key: "stockMinimo", header: "Mínimo", className: "w-24",
            render: (row) => (
              <span className="tabular-nums text-muted-foreground">
                {row.stockMinimo ? Math.round(Number(row.stockMinimo)) : "—"}
              </span>
            ),
          },
          {
            key: "estado", header: "Estado", className: "w-24",
            render: (row) => (
              <Badge variant={row.bajoCritico ? "critical" : "default"}>
                {row.bajoCritico ? "Bajo mínimo" : "OK"}
              </Badge>
            ),
          },
        ]}
        rows={data?.items ?? []}
        isLoading={isLoading || search.trim() !== debouncedSearch.trim()}
        isError={Boolean(error)}
        errorTitle="No se pudo cargar existencias"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim()) || soloBajoCritico}
        onRetry={() => { void refetch(); }}
        onClearFilters={() => { setSearch(""); setSoloBajoCritico(false); setPage(1); }}
        pagination={{
          page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage, onPageSizeChange: (v) => { setPageSize(v); setPage(1); },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin existencias"
        emptyDescription="Registra entradas de insumos para ver los saldos aquí."
      />
    </CatalogModuleLayout>
  );
}

export default ExistenciasPage;
