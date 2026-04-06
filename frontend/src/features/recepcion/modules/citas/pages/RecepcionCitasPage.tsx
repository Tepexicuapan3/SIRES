// frontend/src/features/recepcion/modules/citas/pages/RecepcionCitasPage.tsx

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListarCitas } from "@features/recepcion/modules/citas/queries/useCitasQueries";
import type { FiltrosCitas, CitaMedica, EstatusCita } from "../types/citas.types";
import { NuevaCitaDialog } from "../components/NuevaCitaDialog";

const ESTATUS_LABELS: Record<EstatusCita, string> = {
  agendada:   "Agendada",
  confirmada: "Confirmada",
  cancelada:  "Cancelada",
  atendida:   "Atendida",
  no_asistio: "No asistió",
};

export const RecepcionCitasPage = () => {
  const [filtros, setFiltros] = useState<FiltrosCitas>({ page: 1, page_size: 20 });
  const [busqueda, setBusqueda] = useState("");
  const [nuevaCitaOpen, setNuevaCitaOpen] = useState(false);

  const citasQuery = useListarCitas(filtros);
  const citas: CitaMedica[] = citasQuery.data?.results ?? [];
  const total = citasQuery.data?.total ?? 0;

  const handleBuscar = () => {
    setFiltros((prev) => ({
      ...prev,
      busqueda: busqueda.trim() || undefined,
      page: 1,
    }));
  };

  return (
    <section className="space-y-5 p-6">
      <header className="flex flex-col gap-3 rounded-xl border border-line-struct bg-paper p-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-line-hairline bg-subtle px-3 py-1 text-xs font-medium text-txt-muted">
            <CalendarPlus className="size-3.5" />
            Citas en línea
          </div>
          <h1 className="text-2xl font-semibold text-txt-body">
            Agenda de citas trabajadores y derechohabientes
          </h1>
          <p className="max-w-2xl text-sm text-txt-muted">
            Agenda citas médicas para trabajadores y su núcleo familiar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={() => setNuevaCitaOpen(true)}>
            Nueva cita
          </Button>
        </div>
      </header>

      <section className="space-y-3 rounded-xl border border-line-struct bg-paper p-4">
        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="citas-busqueda">Buscar por nombre o expediente</Label>
            <Input
              id="citas-busqueda"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
              placeholder="Ej. García, 12345"
            />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={handleBuscar}>
              Buscar
            </Button>
          </div>
        </div>
      </section>

      {citasQuery.isLoading ? (
        <p className="text-sm text-txt-muted">Cargando citas...</p>
      ) : null}

      {citasQuery.isError ? (
        <Alert variant="warning">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>No se pudieron cargar las citas.</AlertDescription>
        </Alert>
      ) : null}

      {!citasQuery.isLoading && !citasQuery.isError ? (
        <>
          <p className="text-xs text-txt-muted">{total} citas encontradas</p>

          {citas.length === 0 ? (
            <p className="text-sm text-txt-muted">No hay citas para mostrar.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {citas.map((cita) => (
                <article
                  key={cita.id}
                  className="flex flex-col gap-3 rounded-xl border border-line-struct bg-paper p-4"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {cita.foto_b64 ? (
                          <img
                            src={cita.foto_b64}
                            alt={cita.nombre_paciente}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin foto</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-txt-muted">Paciente</p>
                        <p className="text-base font-semibold text-txt-body">
                          {cita.nombre_paciente}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-line-hairline bg-subtle px-2 py-0.5 text-xs text-txt-muted">
                      {ESTATUS_LABELS[cita.estatus]}
                    </span>
                  </header>

                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-txt-muted">Médico</dt>
                      <dd className="font-medium text-txt-body">{cita.nombre_medico}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-txt-muted">Centro</dt>
                      <dd className="text-txt-body">{cita.nombre_centro}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-txt-muted">Fecha</dt>
                      <dd className="text-txt-body">
                        {new Date(cita.fecha_hora).toLocaleString("es-MX", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}

      <NuevaCitaDialog
        open={nuevaCitaOpen}
        onOpenChange={setNuevaCitaOpen}
      />
    </section>
  );
};

export default RecepcionCitasPage;
