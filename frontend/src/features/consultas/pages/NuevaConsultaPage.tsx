/**
 * Nueva Consulta Médica
 * Formulario para registrar una consulta médica completa
 */

import { useState } from "react";
import {
  FileText,
  Save,
  X,
  User,
  Stethoscope,
  Heart,
  Activity,
  Pill,
  FileSignature,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/textarea";
import { Badge } from "@shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

export const NuevaConsultaPage = () => {
  const [expediente, setExpediente] = useState("");
  const [pacienteEncontrado, setPacienteEncontrado] = useState(false);

  // Mock de búsqueda de paciente
  const handleBuscarPaciente = () => {
    if (expediente === "12345678") {
      setPacienteEncontrado(true);
    }
  };

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <FileText className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Nueva Consulta Médica
              </h1>
              <p className="text-txt-muted">
                Registro de consulta y evolución del paciente
              </p>
            </div>
            <Badge variant="alert" className="ml-auto">
              En desarrollo
            </Badge>
          </div>
        </div>

        {/* Búsqueda de Paciente */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="size-5 text-brand" />
              <CardTitle>Identificar Paciente</CardTitle>
            </div>
            <CardDescription>
              Buscá al paciente por número de expediente o CURP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="No. Expediente (8 dígitos) o CURP (18 caracteres)"
                  value={expediente}
                  onChange={(e) => setExpediente(e.target.value)}
                />
              </div>
              <Button onClick={handleBuscarPaciente}>Buscar</Button>
            </div>

            {pacienteEncontrado && (
              <div className="mt-4 p-4 bg-status-stable/10 border border-status-stable/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-full bg-brand/10 flex items-center justify-center">
                    <User className="size-8 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-txt-body text-lg">
                      María Guadalupe Hernández Pérez
                    </p>
                    <p className="text-sm text-txt-muted">
                      Exp: {expediente} · CURP: HEPM850315MDFRRR02
                    </p>
                    <div className="flex gap-3 text-xs text-txt-hint mt-1">
                      <span>📅 38 años</span>
                      <span>🩸 O+</span>
                      <span>⚕️ Última consulta: 2024-11-20</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {pacienteEncontrado && (
          <>
            {/* Signos Vitales */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-brand" />
                  <CardTitle>Signos Vitales</CardTitle>
                </div>
                <CardDescription>
                  Registrá los signos vitales del paciente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="presion">Presión Arterial</Label>
                    <Input id="presion" placeholder="120/80 mmHg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperatura">Temperatura</Label>
                    <Input id="temperatura" placeholder="36.5 °C" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frecuencia">Frecuencia Cardíaca</Label>
                    <Input id="frecuencia" placeholder="72 lpm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saturacion">Saturación O₂</Label>
                    <Input id="saturacion" placeholder="98%" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso</Label>
                    <Input id="peso" placeholder="kg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="talla">Talla</Label>
                    <Input id="talla" placeholder="cm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imc">IMC</Label>
                    <Input id="imc" placeholder="Calculado" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="glucosa">Glucosa</Label>
                    <Input id="glucosa" placeholder="mg/dL (opcional)" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Motivo y Diagnóstico */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Stethoscope className="size-5 text-brand" />
                  <CardTitle>Consulta Médica</CardTitle>
                </div>
                <CardDescription>
                  Motivo, exploración y diagnóstico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo de Consulta</Label>
                  <Textarea
                    id="motivo"
                    placeholder="¿Por qué acude el paciente? (ej: dolor de cabeza, control, etc.)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exploracion">Exploración Física</Label>
                  <Textarea
                    id="exploracion"
                    placeholder="Hallazgos en la exploración física"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnostico">Diagnóstico (CIE-10)</Label>
                  <Input
                    id="diagnostico"
                    placeholder="Buscá el código CIE-10 o descripción"
                  />
                  <p className="text-xs text-txt-hint">
                    Ejemplo: J00 - Rinofaringitis aguda (resfriado común)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Plan de Tratamiento */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Pill className="size-5 text-brand" />
                  <CardTitle>Plan de Tratamiento</CardTitle>
                </div>
                <CardDescription>
                  Tratamiento, prescripciones e indicaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tratamiento">
                    Tratamiento y Observaciones
                  </Label>
                  <Textarea
                    id="tratamiento"
                    placeholder="Indicaciones generales, reposo, dieta, etc."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_consulta">Tipo de Consulta</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Consulta General</SelectItem>
                      <SelectItem value="control">Control Periódico</SelectItem>
                      <SelectItem value="urgencia">Urgencia</SelectItem>
                      <SelectItem value="especialidad">Especialidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-status-info/10 border border-status-info/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Heart className="size-5 text-status-info mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-txt-body">
                        Recetas y Estudios
                      </p>
                      <p className="text-xs text-txt-muted mt-1">
                        Si necesitás generar recetas médicas o solicitar
                        estudios de laboratorio, usá los botones de abajo para
                        agregar.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">
                      <Pill className="mr-2 size-4" />
                      Agregar Receta
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileSignature className="mr-2 size-4" />
                      Solicitar Estudio
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex gap-3">
              <Button className="flex-1">
                <Save className="mr-2 size-4" />
                Guardar Consulta
              </Button>
              <Button variant="outline">
                <X className="mr-2 size-4" />
                Cancelar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NuevaConsultaPage;
