/**
 * Vista Detallada de Expediente
 * Expediente clínico completo del paciente
 */

import {
  FileText,
  User,
  AlertCircle,
  Heart,
  History,
  Pill,
  FileSignature,
  Download,
  Edit,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ExpedienteDetailPage = () => {
  // Mock data - en producción vendría de useParams() + API
  const mockExpediente = {
    folio: "12345678",
    paciente: "María Guadalupe Hernández Pérez",
    curp: "HEPM850315MDFRRR02",
    fecha_nacimiento: "1985-03-15",
    edad: 38,
    sexo: "Femenino",
    tipo_sangre: "O+",
    telefono: "55-1234-5678",
    email: "maria.hernandez@example.com",
    direccion: "Calle Insurgentes 123, Col. Centro, CDMX",
    status: "activo",
    fecha_apertura: "2018-05-10",
    alergias: ["Penicilina", "Polen"],
    padecimientos_cronicos: [
      "Diabetes Mellitus Tipo 2",
      "Hipertensión Arterial",
    ],
    medicamentos_habituales: [
      "Metformina 850mg cada 12 horas",
      "Losartán 50mg cada 24 horas",
    ],
  };

  const mockConsultasRecientes = [
    {
      id: 1,
      fecha: "2025-01-03",
      medico: "Dr. Juan Carlos Pérez",
      diagnostico: "J00 - Rinofaringitis aguda",
      tratamiento: "Reposo, paracetamol PRN",
    },
    {
      id: 2,
      fecha: "2024-11-20",
      medico: "Dra. María Fernández",
      diagnostico: "E11.9 - Diabetes mellitus tipo 2 (control)",
      tratamiento: "Continuar tratamiento actual",
    },
    {
      id: 3,
      fecha: "2024-08-15",
      medico: "Dr. Pedro Martínez",
      diagnostico: "M54.5 - Dolor lumbar bajo",
      tratamiento: "AINES, reposo relativo",
    },
  ];

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <FileText className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Expediente Clínico
              </h1>
              <p className="text-txt-muted">Folio: {mockExpediente.folio}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 size-4" />
              Exportar
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 size-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* Datos del Paciente */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="size-5 text-brand" />
              <CardTitle>Datos del Paciente</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="size-24 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                <User className="size-12 text-brand" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-txt-body">
                    {mockExpediente.paciente}
                  </h2>
                  <Badge variant="stable">Activo</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-txt-muted">CURP:</span>{" "}
                    <span className="font-mono text-txt-body">
                      {mockExpediente.curp}
                    </span>
                  </div>
                  <div>
                    <span className="text-txt-muted">Folio:</span>{" "}
                    <span className="font-mono text-txt-body">
                      {mockExpediente.folio}
                    </span>
                  </div>
                  <div>
                    <span className="text-txt-muted">Fecha de Nacimiento:</span>{" "}
                    <span className="text-txt-body">
                      {mockExpediente.fecha_nacimiento} ({mockExpediente.edad}{" "}
                      años)
                    </span>
                  </div>
                  <div>
                    <span className="text-txt-muted">Sexo:</span>{" "}
                    <span className="text-txt-body">{mockExpediente.sexo}</span>
                  </div>
                  <div>
                    <span className="text-txt-muted">Tipo de Sangre:</span>{" "}
                    <span className="text-txt-body">
                      {mockExpediente.tipo_sangre}
                    </span>
                  </div>
                  <div>
                    <span className="text-txt-muted">Teléfono:</span>{" "}
                    <span className="text-txt-body">
                      {mockExpediente.telefono}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-txt-muted">Email:</span>{" "}
                    <span className="text-txt-body">
                      {mockExpediente.email}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-txt-muted">Dirección:</span>{" "}
                    <span className="text-txt-body">
                      {mockExpediente.direccion}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Médicas */}
        {(mockExpediente.alergias.length > 0 ||
          mockExpediente.padecimientos_cronicos.length > 0) && (
          <Card className="mb-6 border-status-alert/50 bg-status-alert/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-status-alert" />
                <CardTitle className="text-status-alert">
                  Alertas Médicas
                </CardTitle>
              </div>
              <CardDescription>
                Información crítica para atención médica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockExpediente.alergias.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-txt-body mb-2">
                    ⚠️ Alergias
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mockExpediente.alergias.map((alergia, idx) => (
                      <Badge key={idx} variant="critical">
                        {alergia}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {mockExpediente.padecimientos_cronicos.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-txt-body mb-2">
                    🩺 Padecimientos Crónicos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mockExpediente.padecimientos_cronicos.map((pad, idx) => (
                      <Badge key={idx} variant="alert">
                        {pad}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {mockExpediente.medicamentos_habituales.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-txt-body mb-2">
                    💊 Medicamentos Habituales
                  </p>
                  <ul className="list-disc list-inside text-sm text-txt-muted space-y-1">
                    {mockExpediente.medicamentos_habituales.map((med, idx) => (
                      <li key={idx}>{med}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs de Información */}
        <Tabs defaultValue="historial" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="historial">
              <History className="mr-2 size-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="recetas">
              <Pill className="mr-2 size-4" />
              Recetas
            </TabsTrigger>
            <TabsTrigger value="estudios">
              <FileSignature className="mr-2 size-4" />
              Estudios
            </TabsTrigger>
            <TabsTrigger value="signos">
              <Heart className="mr-2 size-4" />
              Signos Vitales
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historial" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Consultas</CardTitle>
                <CardDescription>
                  Últimas consultas médicas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockConsultasRecientes.map((consulta) => (
                    <div
                      key={consulta.id}
                      className="p-4 bg-subtle rounded-lg hover:bg-bg-paper transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-txt-body">
                            {consulta.fecha}
                          </p>
                          <p className="text-sm text-txt-muted">
                            {consulta.medico}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver Detalle
                        </Button>
                      </div>
                      <div className="text-sm">
                        <p className="text-txt-body">
                          <strong>Diagnóstico:</strong> {consulta.diagnostico}
                        </p>
                        <p className="text-txt-muted mt-1">
                          <strong>Tratamiento:</strong> {consulta.tratamiento}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recetas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recetas Médicas</CardTitle>
                <CardDescription>Historial de prescripciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-txt-muted">
                  <Pill className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Módulo de recetas en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estudios" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Estudios y Laboratorios</CardTitle>
                <CardDescription>
                  Resultados de estudios clínicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-txt-muted">
                  <FileSignature className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Módulo de estudios en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Signos Vitales</CardTitle>
                <CardDescription>
                  Gráficas y tendencias de signos vitales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-txt-muted">
                  <Heart className="size-12 mx-auto mb-4 opacity-50" />
                  <p>Gráficas de signos vitales en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExpedienteDetailPage;
