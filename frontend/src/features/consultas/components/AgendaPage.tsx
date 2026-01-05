/**
 * Agenda de Consultas
 * Vista de calendario y citas programadas
 */

import { Calendar, Clock, UserPlus, Search, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const AgendaPage = () => {
  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Mock data - se reemplazará con backend real
  const mockCitas = [
    {
      id: 1,
      hora: "08:00",
      duracion: 30,
      paciente: "María Guadalupe Hernández",
      expediente: "12345678",
      tipo: "CONSULTA GENERAL",
      motivo: "Control anual + vacunación",
      status: "confirmada",
    },
    {
      id: 2,
      hora: "08:30",
      duracion: 30,
      paciente: "José Luis García Martínez",
      expediente: "87654321",
      tipo: "CONSULTA GENERAL",
      motivo: "Dolor de cabeza recurrente",
      status: "confirmada",
    },
    {
      id: 3,
      hora: "09:00",
      duracion: 45,
      paciente: "Ana Patricia Rodríguez",
      expediente: "11223344",
      tipo: "ESPECIALIDAD",
      motivo: "Dermatología - seguimiento",
      status: "en_curso",
    },
    {
      id: 4,
      hora: "10:00",
      duracion: 30,
      paciente: "Carlos Alberto Sánchez",
      expediente: "99887766",
      tipo: "CONSULTA GENERAL",
      motivo: "Renovación de receta",
      status: "pendiente",
    },
    {
      id: 5,
      hora: "10:30",
      duracion: 30,
      paciente: "Laura Fernanda López",
      expediente: "55667788",
      tipo: "CONSULTA GENERAL",
      motivo: "Control diabetes",
      status: "pendiente",
    },
    {
      id: 6,
      hora: "11:00",
      duracion: 30,
      paciente: "(DISPONIBLE)",
      expediente: "-",
      tipo: "LIBRE",
      motivo: "Espacio disponible",
      status: "libre",
    },
  ];

  const statusBadges = {
    confirmada: { variant: "stable" as const, label: "Confirmada" },
    en_curso: { variant: "info" as const, label: "En Curso" },
    pendiente: { variant: "alert" as const, label: "Pendiente" },
    libre: { variant: "secondary" as const, label: "Disponible" },
    cancelada: { variant: "critical" as const, label: "Cancelada" },
  };

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Calendar className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Agenda de Consultas
              </h1>
              <p className="text-txt-muted">Calendario y citas programadas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 size-4" />
              Filtros
            </Button>
            <Button>
              <UserPlus className="mr-2 size-4" />
              Nueva Cita
            </Button>
          </div>
        </div>

        {/* Stats del día */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Hoy</CardDescription>
              <CardTitle className="text-3xl">18</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-status-stable/30">
            <CardHeader className="pb-3">
              <CardDescription>Confirmadas</CardDescription>
              <CardTitle className="text-3xl text-status-stable">12</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-status-info/30">
            <CardHeader className="pb-3">
              <CardDescription>En Curso</CardDescription>
              <CardTitle className="text-3xl text-status-info">1</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-status-alert/30">
            <CardHeader className="pb-3">
              <CardDescription>Pendientes</CardDescription>
              <CardTitle className="text-3xl text-status-alert">3</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-line-struct">
            <CardHeader className="pb-3">
              <CardDescription>Disponibles</CardDescription>
              <CardTitle className="text-3xl text-txt-muted">2</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario (Placeholder) */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Seleccionar Fecha</CardTitle>
              <CardDescription>
                Navegá por el calendario para ver otras fechas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-subtle rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="size-16 text-brand mx-auto mb-4" />
                  <p className="text-sm text-txt-muted">
                    Calendario interactivo
                  </p>
                  <p className="text-xs text-txt-hint mt-2">
                    Fecha seleccionada: {selectedDate}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-4 space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Hoy
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Mañana
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Esta Semana
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Citas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Citas del Día</CardTitle>
                  <CardDescription>
                    {mockCitas.length} citas programadas para hoy
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-txt-muted" />
                  <Input
                    placeholder="Buscar paciente..."
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCitas.map((cita) => (
                  <div
                    key={cita.id}
                    className={`p-4 rounded-lg border transition-all ${
                      cita.status === "en_curso"
                        ? "border-brand bg-brand/5"
                        : cita.status === "libre"
                          ? "border-dashed border-line-struct bg-subtle/50"
                          : "bg-bg-paper border-line-struct hover:border-brand/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <Clock className="size-5 text-brand mx-auto mb-1" />
                          <p className="text-xs font-semibold text-txt-body">
                            {cita.hora}
                          </p>
                          <p className="text-xs text-txt-hint">
                            {cita.duracion}min
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-txt-body">
                            {cita.paciente}
                          </p>
                          <p className="text-sm text-txt-muted">
                            Exp: {cita.expediente} · {cita.tipo}
                          </p>
                          <p className="text-xs text-txt-hint mt-1">
                            {cita.motivo}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          statusBadges[cita.status as keyof typeof statusBadges]
                            .variant
                        }
                        className="text-xs"
                      >
                        {
                          statusBadges[cita.status as keyof typeof statusBadges]
                            .label
                        }
                      </Badge>
                    </div>

                    {cita.status !== "libre" && (
                      <div className="flex gap-2 pt-3 border-t border-line-hairline">
                        <Button variant="outline" size="sm" className="flex-1">
                          Ver Expediente
                        </Button>
                        {cita.status === "pendiente" && (
                          <Button size="sm" className="flex-1">
                            Iniciar Consulta
                          </Button>
                        )}
                        {cita.status === "en_curso" && (
                          <Button size="sm" className="flex-1">
                            Continuar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgendaPage;
