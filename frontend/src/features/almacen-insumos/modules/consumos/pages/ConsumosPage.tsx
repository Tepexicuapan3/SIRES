import { useState } from "react";
import { toast } from "sonner";
import { Stethoscope, Plus, RotateCcw } from "lucide-react";
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
import type { ConsumoConsulta } from "@api/types";
import { useConsumosList } from "../queries/useConsumosQueries";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";
import { ConsumoCreateDialog } from "../components/ConsumoCreateDialog";

export function ConsumosPage() {
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch]   = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewItem, setViewItem]     = useState<ConsumoConsulta | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, error, refetch } = useConsumosList({
    page, pageSize,
    search: debouncedSearch.trim() || undefined,
  });

  const tableOptions: TableOptionItem[] = [
    { id: "refresh", label: "Actualizar", icon: RotateCcw, isLoading: isFetching,
      disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); } },
  ];

  return (
    <CatalogModuleLayout
      title="Consumos por Consulta"
      description="Insumos utilizados en consultas médicas."
      icon={<Stethoscope className="size-12" />}
    >
      <TableHeaderBar
        search={<TableSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por paciente o médico" />}
        actions={
          <>
            <TableOptionsMenu options={tableOptions} />
            <TablePrimaryAction permission="almacen:consumos:create" label="Nuevo consumo"
              icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)} />
          </>
        }
      />

      <DataTable
        columns={[
          { key: "fchConsumo", header: "Fecha", className: "w-28",
            render: (row) => <span className="font-mono text-xs">{row.fchConsumo}</span> },
          { key: "almacenNombre", header: "Almacén",
            render: (row) => row.almacenNombre },
          { key: "paciente", header: "Paciente",
            render: (row) => row.paciente || <span className="text-muted-foreground text-xs">—</span> },
          { key: "medico", header: "Médico",
            render: (row) => row.medico || <span className="text-muted-foreground text-xs">—</span> },
          { key: "detalles", header: "Insumos", className: "w-20",
            render: (row) => <Badge variant="secondary">{row.detalles.length}</Badge> },
          { key: "createdAt", header: "Registrado", className: "w-36",
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
        errorTitle="No se pudo cargar consumos"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim())}
        onRetry={() => { void refetch(); }}
        onClearFilters={() => { setSearch(""); setPage(1); }}
        pagination={{ page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage, onPageSizeChange: (v) => { setPageSize(v); setPage(1); } }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin consumos registrados"
        emptyDescription="Registra los insumos usados en cada consulta médica."
      />

      <ConsumoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => { toast.success("Consumo registrado"); }}
      />

      {viewItem && (
        <Dialog open onOpenChange={() => setViewItem(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Consumo — {viewItem.paciente || "Sin paciente"}</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-3">
              <div className="grid grid-cols-3 gap-2 text-muted-foreground text-xs">
                <span>Almacén: <strong className="text-foreground">{viewItem.almacenNombre}</strong></span>
                <span>Fecha: <strong className="text-foreground">{viewItem.fchConsumo}</strong></span>
                {viewItem.medico && <span>Médico: <strong className="text-foreground">{viewItem.medico}</strong></span>}
              </div>
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

export default ConsumosPage;
