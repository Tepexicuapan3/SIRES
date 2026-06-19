import { useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck, Plus, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useDebounce } from "@shared/hooks/useDebounce";
import { DataTable } from "@features/admin/shared/components/DataTable";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { TableOptionsMenu, type TableOptionItem } from "@features/admin/shared/components/TableOptionsMenu";
import { TablePrimaryAction } from "@features/admin/shared/components/TablePrimaryAction";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { Badge } from "@shared/ui/badge";
import type { ConteoFisico } from "@api/types";
import { useConteosList } from "../queries/useConteosQueries";
import { getCatalogErrorMessage } from "../../catalogos/utils/catalogos.feedback";
import { ConteoCreateDialog } from "../components/ConteoCreateDialog";
import { ConteoCerrarDialog } from "../components/ConteoCerrarDialog";

export function ConteosPage() {
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch]   = useState("");
  const [createOpen, setCreateOpen]   = useState(false);
  const [cerrarItem, setCerrarItem]   = useState<ConteoFisico | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, error, refetch } = useConteosList({
    page, pageSize,
    search: debouncedSearch.trim() || undefined,
  });

  const tableOptions: TableOptionItem[] = [
    { id: "refresh", label: "Actualizar", icon: RotateCcw, isLoading: isFetching,
      disabled: isFetching, onSelect: () => { if (!isFetching) void refetch(); } },
  ];

  return (
    <CatalogModuleLayout
      title="Conteos Físicos"
      description="Inventario físico. Al cerrar se generan ajustes automáticos al kardex."
      icon={<ClipboardCheck className="size-12" />}
    >
      <TableHeaderBar
        search={<TableSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar por almacén" />}
        actions={
          <>
            <TableOptionsMenu options={tableOptions} />
            <TablePrimaryAction permission="almacen:conteos:create" label="Nuevo conteo"
              icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)} />
          </>
        }
      />

      <DataTable
        columns={[
          { key: "fchConteo", header: "Fecha", className: "w-28",
            render: (row) => <span className="font-mono text-xs">{row.fchConteo}</span> },
          { key: "almacenNombre", header: "Almacén",
            render: (row) => <span className="font-medium">{row.almacenNombre}</span> },
          { key: "detalles", header: "Líneas", className: "w-20",
            render: (row) => <Badge variant="secondary">{row.detalles.length}</Badge> },
          { key: "cerrado", header: "Estado", className: "w-28",
            render: (row) => (
              <Badge variant={row.cerrado ? "default" : "alert"}>
                {row.cerrado ? "Cerrado" : "Abierto"}
              </Badge>
            ) },
          { key: "createdAt", header: "Creado", className: "w-36",
            render: (row) => (
              <span className="text-xs text-muted-foreground">
                {format(new Date(row.createdAt), "dd/MM/yyyy HH:mm")}
              </span>
            ) },
        ]}
        rows={data?.items ?? []}
        onRowClick={(row) => { if (!row.cerrado) setCerrarItem(row); }}
        isLoading={isLoading || search.trim() !== debouncedSearch.trim()}
        isError={Boolean(error)}
        errorTitle="No se pudo cargar conteos"
        errorDescription={getCatalogErrorMessage(error, "Intenta nuevamente.")}
        hasFilters={Boolean(debouncedSearch.trim())}
        onRetry={() => { void refetch(); }}
        onClearFilters={() => { setSearch(""); setPage(1); }}
        pagination={{ page, pageSize, total: data?.total ?? 0, totalPages: data?.totalPages ?? 1,
          onPageChange: setPage, onPageSizeChange: (v) => { setPageSize(v); setPage(1); } }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin conteos registrados"
        emptyDescription="Inicia un conteo físico para verificar las existencias."
      />

      <ConteoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => { toast.success("Conteo creado"); }}
      />

      {cerrarItem && (
        <ConteoCerrarDialog
          conteo={cerrarItem}
          open
          onOpenChange={(v) => { if (!v) setCerrarItem(null); }}
          onSuccess={() => { toast.success("Conteo cerrado y ajustes aplicados"); setCerrarItem(null); }}
        />
      )}
    </CatalogModuleLayout>
  );
}

export default ConteosPage;
