import { Settings2 } from "lucide-react";
import { TurnosFichaPanel } from "@features/recepcion/modules/turnos/components/TurnosFichaPanel";

export function TurnosConfigPage() {
  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Settings2 className="size-5 text-primary" />
          <h1 className="text-xl font-semibold text-txt-body">Configuración de turnos</h1>
        </div>
        <p className="text-sm text-txt-muted">
          Gestiona el número máximo de fichas por turno. Los cambios aplican
          inmediatamente en el turno activo.
        </p>
      </header>

      <div className="max-w-2xl">
        <TurnosFichaPanel />
      </div>
    </div>
  );
}

export default TurnosConfigPage;
