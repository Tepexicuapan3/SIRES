import { Download } from "lucide-react";
import { Button } from "@shared/ui/button";
import { usePatientStudyResults } from "@features/expedientes/queries/usePatientStudyResults";

interface ExpedienteEstudiosTabProps {
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

export function ExpedienteEstudiosTab({
  noExp,
  pkNum = 0,
}: ExpedienteEstudiosTabProps) {
  const { data, isLoading, isError } = usePatientStudyResults(noExp, pkNum);

  if (isLoading) {
    return (
      <p className="text-txt-muted text-sm py-12 text-center">
        Cargando resultados de estudios...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-status-critical text-sm py-12 text-center">
        No se pudo cargar los resultados de estudios de este paciente.
      </p>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <p className="text-txt-muted text-sm py-12 text-center">
        Este paciente todavía no tiene resultados de estudios registrados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.items.map((result) => (
        <div
          key={result.id}
          className="p-4 bg-subtle rounded-lg hover:bg-bg-paper transition-colors flex items-start justify-between gap-4"
        >
          <div>
            <p className="font-semibold text-txt-body">
              {result.studyTypeName}
            </p>
            <p className="text-sm text-txt-muted">
              {formatFecha(result.resultDate)}
            </p>
            {result.notes ? (
              <p className="text-sm text-txt-body mt-1">{result.notes}</p>
            ) : null}
          </div>
          {result.fileUrl ? (
            <Button variant="outline" size="sm" asChild>
              <a href={result.fileUrl} target="_blank" rel="noreferrer">
                <Download className="mr-2 size-4" />
                Ver archivo
              </a>
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
