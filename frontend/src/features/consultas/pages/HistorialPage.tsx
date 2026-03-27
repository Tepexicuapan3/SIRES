import { useState } from "react";
import { ChevronDown, History, Search, UserRound } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Input } from "@shared/ui/input";
import {
  HistorialConsultaDetailDialog,
  type HistorialConsultaItem,
} from "@features/consultas/components/HistorialConsultaDetailDialog";

const HISTORIAL_MOCK: HistorialConsultaItem[] = [
  {
    id: 1,
    fecha: "2025-01-03",
    medico: "Dr. Juan Carlos Perez",
    tipo: "Consulta general",
    diagnostico: "J00 - Rinofaringitis aguda",
    tratamiento: "Reposo, hidratacion y paracetamol PRN",
    signos: { presion: "120/80", temp: "36.8 C", fc: "72 lpm", peso: "68 kg" },
    recetas: 1,
    estudios: 0,
  },
  {
    id: 2,
    fecha: "2024-11-20",
    medico: "Dra. Maria Fernandez",
    tipo: "Control",
    diagnostico: "E11.9 - Diabetes mellitus tipo 2",
    tratamiento: "Continuar metformina 850 mg cada 12 h",
    signos: { presion: "125/82", temp: "36.5 C", fc: "75 lpm", peso: "67 kg" },
    recetas: 1,
    estudios: 1,
  },
  {
    id: 3,
    fecha: "2024-08-15",
    medico: "Dr. Pedro Martinez",
    tipo: "Consulta general",
    diagnostico: "M54.5 - Dolor lumbar bajo",
    tratamiento: "Reposo relativo, AINEs y calor local",
    signos: { presion: "118/78", temp: "36.6 C", fc: "70 lpm", peso: "69 kg" },
    recetas: 1,
    estudios: 0,
  },
  {
    id: 4,
    fecha: "2024-05-10",
    medico: "Dra. Laura Sanchez",
    tipo: "Control",
    diagnostico: "E11.9 - Diabetes mellitus tipo 2",
    tratamiento: "Ajuste de dosis de metformina",
    signos: { presion: "130/85", temp: "36.7 C", fc: "78 lpm", peso: "70 kg" },
    recetas: 1,
    estudios: 2,
  },
];

export const HistorialPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [diagnosticoFiltro, setDiagnosticoFiltro] = useState("");
  const [desdeFiltro, setDesdeFiltro] = useState("");
  const [hastaFiltro, setHastaFiltro] = useState("");
  const [selectedConsulta, setSelectedConsulta] =
    useState<HistorialConsultaItem | null>(null);

  const handleBuscar = () => {
    setPacienteSeleccionado(searchValue.trim() === "12345678");
  };

  const historialFiltrado = HISTORIAL_MOCK.filter((consulta) => {
    const diagnosticoMatch = diagnosticoFiltro
      ? consulta.diagnostico
          .toLowerCase()
          .includes(diagnosticoFiltro.toLowerCase())
      : true;

    const desdeMatch = desdeFiltro ? consulta.fecha >= desdeFiltro : true;
    const hastaMatch = hastaFiltro ? consulta.fecha <= hastaFiltro : true;

    return diagnosticoMatch && desdeMatch && hastaMatch;
  });

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-txt-body">
            <History className="size-5 text-brand" />
            Historial
          </h1>
          <p className="text-sm text-txt-muted">
            Busqueda y seguimiento clinico por paciente.
          </p>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buscar paciente</CardTitle>
            <CardDescription>
              Usa expediente o CURP para abrir el historial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-txt-muted" />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="No. de expediente o CURP"
                  className="pl-9"
                />
              </div>
              <Button type="button" onClick={handleBuscar}>
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {pacienteSeleccionado ? (
          <>
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-brand/10 p-2">
                    <UserRound className="size-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-medium text-txt-body">
                      Maria Guadalupe Hernandez Perez
                    </p>
                    <p className="text-sm text-txt-muted">
                      Exp: 12345678 · 38 anos
                    </p>
                  </div>
                </div>
                <Button variant="outline" type="button">
                  Ver expediente completo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-4">
                <Collapsible open={filtrosOpen} onOpenChange={setFiltrosOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="px-0 text-sm text-txt-muted hover:text-txt-body"
                    >
                      <ChevronDown
                        className={`size-4 transition-transform ${filtrosOpen ? "rotate-180" : "rotate-0"}`}
                      />
                      Filtros secundarios
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-2 rounded-lg border border-line-struct bg-subtle p-3 md:grid-cols-3">
                      <Input
                        placeholder="Diagnostico"
                        value={diagnosticoFiltro}
                        onChange={(event) =>
                          setDiagnosticoFiltro(event.target.value)
                        }
                      />
                      <Input
                        type="date"
                        value={desdeFiltro}
                        onChange={(event) => setDesdeFiltro(event.target.value)}
                      />
                      <Input
                        type="date"
                        value={hastaFiltro}
                        onChange={(event) => setHastaFiltro(event.target.value)}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="space-y-2">
                  {historialFiltrado.map((consulta, index) => (
                    <article
                      key={consulta.id}
                      className="relative border-l border-line-struct pl-4"
                    >
                      <span className="absolute -left-1.5 top-2 size-3 rounded-full bg-brand" />
                      <div className="rounded-lg border border-line-struct bg-paper p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-txt-body">
                              {new Date(consulta.fecha).toLocaleDateString(
                                "es-MX",
                              )}
                            </p>
                            <p className="text-sm text-txt-muted">
                              {consulta.medico}
                            </p>
                            <p className="text-sm text-txt-body">
                              {consulta.diagnostico}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {index === 0 ? (
                                <Badge variant="info">Mas reciente</Badge>
                              ) : null}
                              {consulta.recetas > 0 ? (
                                <Badge variant="secondary">
                                  {consulta.recetas} receta(s)
                                </Badge>
                              ) : null}
                              {consulta.estudios > 0 ? (
                                <Badge variant="secondary">
                                  {consulta.estudios} estudio(s)
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setSelectedConsulta(consulta)}
                          >
                            Ver detalle
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <HistorialConsultaDetailDialog
        consulta={selectedConsulta}
        open={Boolean(selectedConsulta)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedConsulta(null);
          }
        }}
      />
    </div>
  );
};

export default HistorialPage;
