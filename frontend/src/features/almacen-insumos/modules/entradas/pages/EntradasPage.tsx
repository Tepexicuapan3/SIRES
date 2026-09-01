import { useState } from "react";
import { PackagePlus, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "@shared/hooks/useDebounce";
import { DataTable } from "@features/admin/shared/components/DataTable";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { TableOptionsMenu, type TableOptionItem } from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shared/ui/dialog";
import type { EntradaInventario } from "@api/types";
import { useEntradasList } from "../queries/useEntradasQueries";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";
import { EntradaCreateDialog } from "../components/EntradaCreateDialog";

export function EntradasPage() {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch]     = useState("");
  const [idAlmacen] = useState<number | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewItem, setViewItem]     = useState<EntradaInventario | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, error, refetch } = useEntradasList({
    page, pageSize,
    search: debouncedSearch.trim() || undefined,
    idAlmacen,
  });

  const tableOptions: TableOptionItem[] = [
    {
      id: "refresh", label: "Actualizar", icon: RotateCcw, isLoading: isFetching,
      disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); },
    },
  ];

  return (
    <CatalogModuleLayout
      title="Entradas de Inventario"
      description="Registro de entradas de insumos al almacén."
      icon={<PackagePlus className="size-12" />}
    >
      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Buscar por remisión o almacén"
          />
        }
        actions={
          <>
            <TableOptionsMenu options={tableOptions} />
            <TablePrimaryAction
              permission="almacen:entradas:create"
              label="Nueva entrada"
              icon={<PackagePlus className="size-4" />}
              onClick={() => setCreateOpen(true)}
            />
          </>
        }
      />

      <DataTable
        columns={[
          {
            key: "fchEntrada", header: "Fecha", className: "w-32",
            render: (row) => <span className="font-mono text-xs">{row.fchEntrada}</span>,
          },
          {
            key: "almacenNombre", header: "Almacén",
            render: (row) => <span className="font-medium">{row.almacenNombre}</span>,
          },
          {
            key: "numRemision", header: "Remisión",
            render: (row) => row.numRemision || <span className="text-muted-foreground text-xs">—</span>,
          },
          {
            key: "detalles", header: "Líneas", className: "w-20",
            render: (row) => (
              <Badge variant="secondary">{row.detalles.length} insumos</Badge>
            ),
          },
          {
            key: "createdAt", header: "Registrada", className: "w-36",
            render: (row) => (
              <span className="text-xs text-muted-foreground">
                {format(new Date(row.createdAt), "dd/MM/yyyy HH:mm")}
              </span>
            ),
          },
        ]}
        rows={data?.items ?? []}
        onRowClick={(row) => setViewItem(row)}
        isLoading={isLoading || search.trim() !== debouncedSearch.trim()}
        isError={Boolean(error)}
        errorTitle="No se pudo cargar entradas"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim())}
        onRetry={() => { void refetch(); }}
        onClearFilters={() => { setSearch(""); setPage(1); }}
        pagination={{
          page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage, onPageSizeChange: (v) => { setPageSize(v); setPage(1); },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin entradas registradas"
        emptyDescription="Registra la primera entrada de insumos al almacén."
      />

      <EntradaCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => { void refetch(); }}
      />

      {viewItem && (
        <Dialog open={Boolean(viewItem)} onOpenChange={(v) => { if (!v) setViewItem(null); }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Entrada #{viewItem.id} — {viewItem.almacenNombre}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Fecha</p>
                  <p className="font-medium">{viewItem.fchEntrada}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Remisión</p>
                  <p className="font-medium">{viewItem.numRemision || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Registrada</p>
                  <p className="font-medium">{format(new Date(viewItem.createdAt), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>
              {viewItem.observaciones && (
                <p className="text-sm text-muted-foreground">{viewItem.observaciones}</p>
              )}
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-4">Insumo</th>
                    <th className="text-left py-1 pr-4">Lote</th>
                    <th className="text-right py-1">Cantidad</th>
                    <th className="text-right py-1">Costo unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {viewItem.detalles.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-1 pr-4">{d.insumoNombre}</td>
                      <td className="py-1 pr-4 font-mono text-xs">{d.numLote || "—"}</td>
                      <td className="py-1 text-right">{d.cantidad}</td>
                      <td className="py-1 text-right text-muted-foreground">
                        {d.costoUnitario ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewItem(null)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </CatalogModuleLayout>
  );
}

export default EntradasPage;
