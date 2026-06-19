import { useState } from "react";
import { ClipboardList, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "@shared/hooks/useDebounce";
import { DataTable } from "@features/admin/shared/components/DataTable";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { TableOptionsMenu, type TableOptionItem } from "@features/admin/shared/components/TableOptionsMenu";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { Badge } from "@shared/ui/badge";
import { TIPO_MOVIMIENTO_LABELS } from "@api/types";
import { useKardexList } from "../queries/useKardexQueries";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";

const TIPO_VARIANT: Record<string, "default" | "secondary" | "critical" | "outline"> = {
  ENTRADA:          "default",
  DEVOLUCION:       "default",
  AJUSTE_POSITIVO:  "secondary",
  SALIDA:           "outline",
  CONSUMO:          "outline",
  MERMA:            "critical",
  AJUSTE_NEGATIVO:  "critical",
};

export function KardexPage() {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch]     = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, error, refetch } = useKardexList({
    page, pageSize, search: debouncedSearch.trim() || undefined,
  });

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh", label: "Actualizar", icon: RotateCcw, isLoading: isFetching,
      disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); },
    },
  ];

  return (
    <CatalogModuleLayout
      title="Kardex de Movimientos"
      description="Historial completo e inmutable de movimientos de inventario."
      icon={<ClipboardList className="size-12" />}
    >
      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Buscar por insumo o tipo de movimiento"
          />
        }
        actions={<TableOptionsMenu options={tableOptions} />}
      />

      <DataTable
        columns={[
          {
            key: "fchMovimiento", header: "Fecha", className: "w-36",
            render: (row) => (
              <span className="font-mono text-xs">
                {format(new Date(row.fchMovimiento), "dd/MM/yy HH:mm")}
              </span>
            ),
          },
          {
            key: "tipoMovimiento", header: "Tipo", className: "w-36",
            render: (row) => (
              <Badge variant={TIPO_VARIANT[row.tipoMovimiento] ?? "outline"}>
                {TIPO_MOVIMIENTO_LABELS[row.tipoMovimiento] ?? row.tipoMovimiento}
              </Badge>
            ),
          },
          {
            key: "insumoNombre", header: "Insumo",
            render: (row) => <span className="font-medium">{row.insumoNombre}</span>,
          },
          {
            key: "numLote", header: "Lote", className: "w-28",
            render: (row) => (
              <span className="font-mono text-xs">{row.numLote || "—"}</span>
            ),
          },
          {
            key: "cantidad", header: "Cantidad", className: "w-24",
            render: (row) => <span className="tabular-nums text-right">{Math.round(Number(row.cantidad))}</span>,
          },
          {
            key: "saldoResultante", header: "Saldo", className: "w-24",
            render: (row) => <span className="tabular-nums font-semibold">{Math.round(Number(row.saldoResultante))}</span>,
          },
          {
            key: "refModelo", header: "Origen", className: "w-40",
            render: (row) => (
              <span className="text-xs text-muted-foreground">{row.refModelo} #{row.refId}</span>
            ),
          },
        ]}
        rows={data?.items ?? []}
        isLoading={isLoading || search.trim() !== debouncedSearch.trim()}
        isError={Boolean(error)}
        errorTitle="No se pudo cargar el kardex"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim())}
        onRetry={() => { void refetch(); }}
        onClearFilters={() => { setSearch(""); setPage(1); }}
        pagination={{
          page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage, onPageSizeChange: (v) => { setPageSize(v); setPage(1); },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin movimientos registrados"
        emptyDescription="Los movimientos aparecen aquí al registrar entradas, salidas o consumos."
      />
    </CatalogModuleLayout>
  );
}

export default KardexPage;
