import { useState } from "react";
import { Radio } from "lucide-react";
import { useDebounce } from "@shared/hooks/useDebounce";
import { Button } from "@shared/ui/button";
import { DataTable } from "@features/admin/shared/components/DataTable";
import { TableHeaderBar } from "@features/admin/shared/components/TableHeaderBar";
import { TableSearch } from "@features/admin/shared/components/TableSearch";
import { AdminPageIntro } from "@features/admin/shared/components/AdminPageIntro";
import { useSessionsList } from "@/domains/auth-access/hooks/sessions/useSessionsList";
import { sessionsTableColumns } from "@/domains/auth-access/components/admin/sessions/SessionsTableColumns";
import { cn } from "@shared/utils/styling/cn";

export function SessionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [soloActivas, setSoloActivas] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching, error, refetch } = useSessionsList({
    page,
    pageSize,
    usuario: debouncedSearch || undefined,
    soloActivas,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto w-full space-y-6 px-4 pb-2 sm:px-6 lg:max-w-[1360px] lg:px-8 xl:px-10">
      <AdminPageIntro
        title="Conexiones"
        description="Control de sesión única: quién está conectado ahora, desde qué IP y por cuánto tiempo."
        icon={<Radio className="size-12" />}
      />

      <TableHeaderBar
        search={
          <TableSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Buscar por usuario"
          />
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            className={cn("h-9", soloActivas && "border-brand text-brand")}
            onClick={() => {
              setSoloActivas((prev) => !prev);
              setPage(1);
            }}
          >
            {soloActivas ? "Mostrando activas" : "Solo activas"}
          </Button>
        }
      />

      <DataTable
        columns={sessionsTableColumns}
        rows={rows}
        isLoading={isLoading}
        isError={Boolean(error)}
        errorTitle="No se pudo cargar el historial de conexiones"
        errorDescription="Ocurrió un error al obtener la información. Intenta nuevamente."
        hasFilters={Boolean(debouncedSearch.trim()) || soloActivas}
        onRetry={() => void refetch()}
        onClearFilters={() => {
          setSearch("");
          setSoloActivas(false);
          setPage(1);
        }}
        pagination={{
          page,
          pageSize,
          total,
          totalPages,
          onPageChange: setPage,
          onPageSizeChange: (value) => {
            setPageSize(value);
            setPage(1);
          },
        }}
        getRowKey={(row) => row.id.toString()}
        emptyTitle="Sin conexiones"
        emptyDescription="Cuando los usuarios inicien sesión, sus conexiones se listarán aquí."
        footerNote={isFetching ? "Actualizando…" : undefined}
      />
    </div>
  );
}

export default SessionsPage;
