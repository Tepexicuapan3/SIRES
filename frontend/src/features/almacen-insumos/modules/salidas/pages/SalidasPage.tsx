import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpFromLine, Plus, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "@shared/hooks/useDebounce";
import { DataTable } from "@features/admin/shared/components/DataTable";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { TableOptionsMenu, type TableOptionItem } from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { Badge } from "@shared/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/ui/dialog";
import type { SalidaInventario } from "@api/types";
import { TIPO_SALIDA_LABELS } from "@api/types";
import { useSalidasList } from "../queries/useSalidasQueries";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";
import { SalidaCreateDialog } from "../components/SalidaCreateDialog";

export function SalidasPage() {
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch]   = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewItem, setViewItem]     = useState<SalidaInventario | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, error, refetch } = useSalidasList({
    page, pageSize,
    search: debouncedSearch.trim() || undefined,
  });

  const tableOptions: TableOptionItem[] = [
    { id: "refresh", label: "Actualizar", icon: RotateCcw, isLoading: isFetching,
      disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); } },
  ];

  const TIPO_VARIANT: Record<string, "default" | "secondary" | "critical" | "outline"> = {
    SALIDA:     "outline",
    MERMA:      "critical",
    DEVOLUCION: "secondary",
  };

  return (
    <CatalogModuleLayout
      title="Salidas de Inventario"
      description="Registra salidas directas, mermas y devoluciones."
      icon={<ArrowUpFromLine className="size-12" />}
    >
      <TableHeaderBar
        search={<TableSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por folio o almacén" />}
        actions={
          <>
            <TableOptionsMenu options={tableOptions} />
            <TablePrimaryAction permission="almacen:salidas:create" label="Nueva salida"
              icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)} />
          </>
        }
      />

      <DataTable
        columns={[
          { key: "fchSalida", header: "Fecha", className: "w-28",
            render: (row) => <span className="font-mono text-xs">{row.fchSalida}</span> },
          { key: "tipoSalida", header: "Tipo", className: "w-36",
            render: (row) => (
              <Badge variant={TIPO_VARIANT[row.tipoSalida] ?? "outline"}>
                {TIPO_SALIDA_LABELS[row.tipoSalida] ?? row.tipoSalida}
              </Badge>
            ) },
          { key: "almacenNombre", header: "Almacén",
            render: (row) => <span className="font-medium">{row.almacenNombre}</span> },
          { key: "numFolio", header: "Folio",
            render: (row) => row.numFolio || <span className="text-muted-foreground text-xs">—</span> },
          { key: "detalles", header: "Líneas", className: "w-20",
            render: (row) => <Badge variant="secondary">{row.detalles.length} insumos</Badge> },
          { key: "createdAt", header: "Registrada", className: "w-36",
            render: (row) => (
              <span className="text-xs text-muted-foreground">
                {format(new Date(row.createdAt), "dd/MM/yyyy HH:mm")}
              </span>
            ) },
        ]}
        rows={data?.items ?? []}
        onRowClick={(row) => setViewItem(row)}
        isLoading={isLoading || search.trim() !== debouncedSearch.trim()}
        isError={Boolean(error)}
        errorTitle="No se pudo cargar salidas"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim())}
        onRetry={() => { void refetch(); }}
        onClearFilters={() => { setSearch(""); setPage(1); }}
        pagination={{ page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage, onPageSizeChange: (v) => { setPageSize(v); setPage(1); } }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin salidas registradas"
        emptyDescription="Registra las salidas, mermas y devoluciones de insumos."
      />

      <SalidaCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => { toast.success("Salida registrada"); }}
      />

      {viewItem && (
        <Dialog open onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalle — {TIPO_SALIDA_LABELS[viewItem.tipoSalida]} {viewItem.numFolio && `(${viewItem.numFolio})`}</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-3">
              <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                <span>Almacén: <strong className="text-foreground">{viewItem.almacenNombre}</strong></span>
                <span>Fecha: <strong className="text-foreground">{viewItem.fchSalida}</strong></span>
              </div>
              {viewItem.motivo && <p className="text-xs text-muted-foreground">{viewItem.motivo}</p>}
              <table className="w-full text-xs">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-left pb-1">Insumo</th>
                  <th className="text-left pb-1">Lote</th>
                  <th className="text-right pb-1">Cantidad</th>
                </tr></thead>
                <tbody>
                  {viewItem.detalles.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-1">{d.insumoNombre}</td>
                      <td className="py-1 font-mono">{d.numLote || "—"}</td>
                      <td className="py-1 text-right tabular-nums">{d.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </CatalogModuleLayout>
  );
}

export default SalidasPage;
