/**
 * Historial de Consultas
 * Vista completa del historial clínico del paciente
 */

import { useState } from "react";
import {
  History,
  Search,
  Filter,
  FileText,
  Pill,
  Activity,
  Calendar,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const HistorialPage = () => {
  const [expedienteBusqueda, setExpedienteBusqueda] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(false);

  // Mock data - se reemplazará con backend real
  const mockHistorial = [
    {
      id: 1,
      fecha: "2025-01-03",
      medico: "Dr. Juan Carlos Pérez",
      tipo: "CONSULTA GENERAL",
      diagnostico: "J00 - Rinofaringitis aguda (resfriado común)",
      tratamiento: "Reposo, hidratación, paracetamol PRN",
      signos: {
        presion: "120/80",
        temp: "36.8°C",
        fc: "72 lpm",
        peso: "68 kg",
      },
      recetas: 1,
      estudios: 0,
    },
    {
      id: 2,
      fecha: "2024-11-20",
      medico: "Dra. María Fernández",
      tipo: "CONTROL",
      diagnostico: "E11.9 - Diabetes mellitus tipo 2",
      tratamiento: "Continuar con metformina 850mg c/12h",
      signos: {
        presion: "125/82",
        temp: "36.5°C",
        fc: "75 lpm",
        peso: "67 kg",
      },
      recetas: 1,
      estudios: 1,
    },
    {
      id: 3,
      fecha: "2024-08-15",
      medico: "Dr. Pedro Martínez",
      tipo: "CONSULTA GENERAL",
      diagnostico: "M54.5 - Dolor lumbar bajo",
      tratamiento: "Reposo relativo, AINES, calor local",
      signos: {
        presion: "118/78",
        temp: "36.6°C",
        fc: "70 lpm",
        peso: "69 kg",
      },
      recetas: 1,
      estudios: 0,
    },
    {
      id: 4,
      fecha: "2024-05-10",
      medico: "Dra. Laura Sánchez",
      tipo: "CONTROL",
      diagnostico: "E11.9 - Diabetes mellitus tipo 2",
      tratamiento: "Ajuste de dosis metformina a 850mg",
      signos: {
        presion: "130/85",
        temp: "36.7°C",
        fc: "78 lpm",
        peso: "70 kg",
      },
      recetas: 1,
      estudios: 2,
    },
  ];

  const handleBuscar = () => {
    if (expedienteBusqueda === "12345678") {
      setPacienteSeleccionado(true);
    }
  };

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <History className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Historial de Consultas
              </h1>
              <p className="text-txt-muted">
                Evolución y registro clínico del paciente
              </p>
            </div>
          </div>
        </div>

        {/* Búsqueda de Paciente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Paciente</CardTitle>
            <CardDescription>
              Ingresá el número de expediente o CURP del paciente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-txt-muted" />
                <Input
                  placeholder="No. Expediente o CURP"
                  value={expedienteBusqueda}
                  onChange={(e) => setExpedienteBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleBuscar}>Buscar</Button>
            </div>
          </CardContent>
        </Card>

        {pacienteSeleccionado && (
          <>
            {/* Info del Paciente */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Datos del Paciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="size-20 rounded-full bg-brand/10 flex items-center justify-center">
                    <User className="size-10 text-brand" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-txt-body">
                      María Guadalupe Hernández Pérez
                    </h2>
                    <p className="text-txt-muted">
                      Exp: 12345678 · CURP: HEPM850315MDFRRR02
                    </p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-txt-hint">
                        📅 38 años (15/03/1985)
                      </span>
                      <span className="text-txt-hint">🩸 Tipo O+</span>
                      <span className="text-txt-hint">⚕️ Diabética tipo 2</span>
                    </div>
                  </div>
                  <Button variant="outline">Ver Expediente Completo</Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats de Historial */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Consultas</CardDescription>
                  <CardTitle className="text-3xl">
                    {mockHistorial.length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Última Consulta</CardDescription>
                  <CardTitle className="text-lg">03/01/2025</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Recetas Emitidas</CardDescription>
                  <CardTitle className="text-3xl">
                    {mockHistorial.reduce((sum, c) => sum + c.recetas, 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Estudios Solicitados</CardDescription>
                  <CardTitle className="text-3xl">
                    {mockHistorial.reduce((sum, c) => sum + c.estudios, 0)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Filtros */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="size-5 text-brand" />
                    <CardTitle>Filtros</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm">
                    Limpiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Buscar por diagnóstico..."
                    className="flex-1"
                  />
                  <Input type="date" placeholder="Desde" className="w-40" />
                  <Input type="date" placeholder="Hasta" className="w-40" />
                </div>
              </CardContent>
            </Card>

            {/* Timeline de Consultas */}
            <Card>
              <CardHeader>
                <CardTitle>Historial Clínico</CardTitle>
                <CardDescription>
                  {mockHistorial.length} consultas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockHistorial.map((consulta, index) => (
                    <div
                      key={consulta.id}
                      className="relative pl-8 pb-4 border-l-2 border-line-struct last:border-0"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-0 -translate-x-1/2 size-4 rounded-full bg-brand border-2 border-bg-app" />

                      <div className="bg-subtle rounded-lg p-4 hover:bg-bg-paper transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="size-4 text-brand" />
                              <span className="font-semibold text-txt-body">
                                {new Date(consulta.fecha).toLocaleDateString(
                                  "es-MX",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                              {index === 0 && (
                                <Badge variant="info" className="text-xs">
                                  Más reciente
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-txt-muted">
                              {consulta.medico} · {consulta.tipo}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="size-4 text-brand" />
                              <span className="text-sm font-semibold text-txt-body">
                                Diagnóstico
                              </span>
                            </div>
                            <p className="text-sm text-txt-muted pl-6">
                              {consulta.diagnostico}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Pill className="size-4 text-brand" />
                              <span className="text-sm font-semibold text-txt-body">
                                Tratamiento
                              </span>
                            </div>
                            <p className="text-sm text-txt-muted pl-6">
                              {consulta.tratamiento}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-line-hairline">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="size-4 text-brand" />
                            <span className="text-xs font-semibold text-txt-body">
                              Signos Vitales
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs text-txt-muted pl-6">
                            <span>PA: {consulta.signos.presion}</span>
                            <span>Temp: {consulta.signos.temp}</span>
                            <span>FC: {consulta.signos.fc}</span>
                            <span>Peso: {consulta.signos.peso}</span>
                          </div>
                        </div>

                        {(consulta.recetas > 0 || consulta.estudios > 0) && (
                          <div className="flex gap-3 mt-3">
                            {consulta.recetas > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                📝 {consulta.recetas} receta(s)
                              </Badge>
                            )}
                            {consulta.estudios > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                🔬 {consulta.estudios} estudio(s)
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default HistorialPage;
