import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { CatalogModuleLayout } from "@features/admin/modules/catalogos/shared/components/CatalogModuleLayout";
import { Badge } from "@shared/ui/badge";
import { dashboardAPI } from "@api/resources/almacen/kardex.api";
import { TIPO_MOVIMIENTO_LABELS } from "@api/types";

function StatCard({ icon, label, value, variant = "default" }: {
  icon:     React.ReactNode;
  label:    string;
  value:    number;
  variant?: "default" | "alert";
}) {
  return (
    <div className={`rounded-lg border p-4 flex items-center gap-4 ${variant === "alert" ? "border-destructive/40 bg-destructive/5" : "bg-card"}`}>
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function DashboardAlmacenPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["almacen", "dashboard"],
    queryFn:  () => dashboardAPI.stats(),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <CatalogModuleLayout title="Dashboard Almacén" description="Resumen del inventario." icon={<LayoutDashboard className="size-12" />}>
        <div className="text-sm text-muted-foreground">Cargando estadísticas...</div>
      </CatalogModuleLayout>
    );
  }

  const TIPO_VARIANT: Record<string, "default" | "secondary" | "critical" | "outline"> = {
    ENTRADA:         "default",
    DEVOLUCION:      "default",
    AJUSTE_POSITIVO: "secondary",
    SALIDA:          "outline",
    CONSUMO:         "outline",
    MERMA:           "critical",
    AJUSTE_NEGATIVO: "critical",
  };

  return (
    <CatalogModuleLayout
      title="Dashboard Almacén"
      description="Resumen del inventario de insumos."
      icon={<LayoutDashboard className="size-12" />}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Package className="size-8" />}           label="Insumos activos"    value={data?.totalInsumos ?? 0} />
        <StatCard icon={<AlertTriangle className="size-8" />}    label="Bajo stock mínimo"  value={data?.bajoStock ?? 0}    variant="alert" />
        <StatCard icon={<ArrowDownToLine className="size-8" />}  label="Entradas este mes"  value={data?.entradasMes ?? 0} />
        <StatCard icon={<ArrowUpFromLine className="size-8" />}  label="Salidas este mes"   value={data?.salidasMes ?? 0} />
        <StatCard icon={<Stethoscope className="size-8" />}      label="Consumos este mes"  value={data?.consumosMes ?? 0} />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Últimos movimientos</p>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">Insumo</th>
                <th className="text-left px-3 py-2 w-[130px]">Tipo</th>
                <th className="text-right px-3 py-2 w-[80px]">Cantidad</th>
                <th className="text-right px-3 py-2 w-[140px]">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(data?.movimientosRecientes ?? []).map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-3 py-2">{m.insumoNombre}</td>
                  <td className="px-3 py-2">
                    <Badge variant={TIPO_VARIANT[m.tipoMovimiento] ?? "outline"} className="text-xs">
                      {TIPO_MOVIMIENTO_LABELS[m.tipoMovimiento] ?? m.tipoMovimiento}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{m.cantidad}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {format(new Date(m.fchMovimiento), "dd/MM/yy HH:mm")}
                  </td>
                </tr>
              ))}
              {!data?.movimientosRecientes?.length && (
                <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Sin movimientos recientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </CatalogModuleLayout>
  );
}

export default DashboardAlmacenPage;
