import { useState } from "react";
import { Calendar, ChevronDown, Clock, Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { AgendaToolsDialog } from "@features/consultas/components/AgendaToolsDialog";

const APPOINTMENTS = [
  {
    id: 1,
    hora: "08:00",
    duracion: 30,
    paciente: "Maria Guadalupe Hernandez",
    expediente: "12345678",
    motivo: "Control anual y vacunacion",
    status: "confirmada",
  },
  {
    id: 2,
    hora: "08:30",
    duracion: 30,
    paciente: "Jose Luis Garcia",
    expediente: "87654321",
    motivo: "Cefalea recurrente",
    status: "confirmada",
  },
  {
    id: 3,
    hora: "09:00",
    duracion: 45,
    paciente: "Ana Patricia Rodriguez",
    expediente: "11223344",
    motivo: "Seguimiento de dermatologia",
    status: "en_curso",
  },
  {
    id: 4,
    hora: "10:00",
    duracion: 30,
    paciente: "Carlos Alberto Sanchez",
    expediente: "99887766",
    motivo: "Renovacion de receta",
    status: "pendiente",
  },
  {
    id: 5,
    hora: "10:30",
    duracion: 30,
    paciente: "Laura Fernanda Lopez",
    expediente: "55667788",
    motivo: "Control de diabetes",
    status: "pendiente",
  },
  {
    id: 6,
    hora: "11:00",
    duracion: 30,
    paciente: "Bloque libre",
    expediente: "-",
    motivo: "Disponible para sobrecupo",
    status: "libre",
  },
] as const;

const STATUS_META = {
  confirmada: { label: "Confirmada", variant: "stable" },
  en_curso: { label: "En curso", variant: "info" },
  pendiente: { label: "Pendiente", variant: "alert" },
  libre: { label: "Libre", variant: "secondary" },
} as const;

export const AgendaPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const filteredAppointments = APPOINTMENTS.filter((appointment) => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    return (
      appointment.paciente.toLowerCase().includes(normalizedQuery) ||
      appointment.expediente.toLowerCase().includes(normalizedQuery) ||
      appointment.motivo.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-txt-body">Agenda</h1>
            <p className="text-sm text-txt-muted">
              Citas del dia y continuidad de atencion.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setToolsOpen(true)}>
              Gestion avanzada
            </Button>
            <Button>
              <UserPlus className="size-4" />
              Nueva cita
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Busqueda rapida</CardTitle>
            <CardDescription>
              Paciente, expediente o motivo de consulta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-txt-muted" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar en agenda..."
                className="pl-9"
              />
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="px-0 text-sm text-txt-muted hover:text-txt-body"
                >
                  <ChevronDown
                    className={`size-4 transition-transform ${advancedOpen ? "rotate-180" : "rotate-0"}`}
                  />
                  Acciones secundarias
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-1">
                <div className="grid gap-2 rounded-lg border border-line-struct bg-subtle p-3 md:grid-cols-3">
                  <Button variant="outline" size="sm" type="button">
                    Ver agenda semanal
                  </Button>
                  <Button variant="outline" size="sm" type="button">
                    Reprogramar bloque
                  </Button>
                  <Button variant="outline" size="sm" type="button">
                    Marcar ausencias
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Citas</CardTitle>
              <CardDescription>
                {filteredAppointments.length} resultados
              </CardDescription>
            </div>
            <Badge variant="outline">
              <Calendar className="size-3" />
              Hoy
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredAppointments.map((appointment) => (
                <article
                  key={appointment.id}
                  className="rounded-xl border border-line-struct bg-paper p-3 transition-colors hover:border-brand/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="min-w-16 text-center">
                        <Clock className="mx-auto mb-1 size-4 text-brand" />
                        <p className="text-sm font-semibold text-txt-body">
                          {appointment.hora}
                        </p>
                        <p className="text-xs text-txt-hint">
                          {appointment.duracion} min
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-txt-body">
                          {appointment.paciente}
                        </p>
                        <p className="text-sm text-txt-muted">
                          Exp: {appointment.expediente} · {appointment.motivo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_META[appointment.status].variant}>
                        {STATUS_META[appointment.status].label}
                      </Badge>
                      {appointment.status === "libre" ? (
                        <Button size="sm" variant="outline" type="button">
                          Reservar
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" type="button">
                            Ver
                          </Button>
                          <Button size="sm" type="button">
                            {appointment.status === "en_curso"
                              ? "Continuar"
                              : "Iniciar"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AgendaToolsDialog open={toolsOpen} onOpenChange={setToolsOpen} />
    </div>
  );
};

export default AgendaPage;
