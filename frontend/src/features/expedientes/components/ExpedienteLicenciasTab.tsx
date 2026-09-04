import { Badge } from "@shared/ui/badge";
import { usePatientMedicalLeaves } from "@features/expedientes/queries/usePatientMedicalLeaves";

interface ExpedienteLicenciasTabProps {
  noExp: string;
  pkNum?: number;
}

const formatFecha = (fecha: string) => {
  try {
    return new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return fecha;
  }
};

export function ExpedienteLicenciasTab({
  noExp,
  pkNum = 0,
}: ExpedienteLicenciasTabProps) {
  const { data, isLoading, isError } = usePatientMedicalLeaves(noExp, pkNum);

  if (isLoading) {
    return (
      <p className="text-txt-muted text-sm py-12 text-center">
        Cargando licencias médicas...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-status-critical text-sm py-12 text-center">
        No se pudo cargar el historial de licencias de este paciente.
      </p>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <p className="text-txt-muted text-sm py-12 text-center">
        Este paciente todavía no tiene licencias médicas registradas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.items.map((leave) => (
        <div
          key={leave.id}
          className="p-4 bg-subtle rounded-lg hover:bg-bg-paper transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-txt-body">
                {formatFecha(leave.startDate)} — {formatFecha(leave.endDate)}
                <span className="text-txt-muted font-normal">
                  {" "}
                  ({leave.days} día{leave.days === 1 ? "" : "s"})
                </span>
              </p>
              <p className="text-sm text-txt-muted font-mono">{leave.folio}</p>
            </div>
            <Badge variant={leave.isSubsequent ? "info" : "stable"}>
              {leave.isSubsequent ? "Subsecuente" : "1a Incapacidad"}
            </Badge>
          </div>
          <p className="text-sm text-txt-body">{leave.leaveTypeName}</p>
        </div>
      ))}
    </div>
  );
}
