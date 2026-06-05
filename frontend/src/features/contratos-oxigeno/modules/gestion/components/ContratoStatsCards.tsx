import { Loader2 } from "lucide-react";
import type { ContratosStats } from "@api/types";

interface Props {
  stats:     ContratosStats | undefined;
  isLoading: boolean;
}

interface StatCardProps {
  label:     string;
  value:     number | string;
  colorBg:   string;
  colorText: string;
  colorBorder: string;
}

function StatCard({ label, value, colorBg, colorText, colorBorder }: StatCardProps) {
  return (
    <article className={`rounded-xl border ${colorBorder} ${colorBg} p-4`}>
      <p className={`text-sm font-medium ${colorText}/80`}>{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colorText}`}>{value}</p>
    </article>
  );
}

export function ContratoStatsCards({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center gap-2 text-sm text-txt-muted">
        <Loader2 className="size-4 animate-spin" /> Cargando estadísticas...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total contratos"
        value={stats.total}
        colorBg="bg-blue-50"
        colorText="text-blue-700"
        colorBorder="border-blue-200"
      />
      <StatCard
        label="Vigentes"
        value={stats.vigentes}
        colorBg="bg-green-50"
        colorText="text-green-700"
        colorBorder="border-green-200"
      />
      <StatCard
        label="Por vencer (≤ 30 días)"
        value={stats.porVencer}
        colorBg="bg-amber-50"
        colorText="text-amber-700"
        colorBorder="border-amber-200"
      />
      <StatCard
        label="Vencidos"
        value={stats.vencidos}
        colorBg="bg-red-50"
        colorText="text-red-700"
        colorBorder="border-red-200"
      />
    </div>
  );
}
