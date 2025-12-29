/**
 * Panel de Consultas - Médicos
 * Landing page para usuarios con rol MEDICOS
 */

import {
  Stethoscope,
  Calendar,
  FileText,
  Pill,
  TestTube,
  ClipboardList,
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
import { useAuthStore } from "@/store/authStore";
import { Link } from "react-router-dom";

export const ConsultasPage = () => {
  const user = useAuthStore((state) => state.user);

  const medicalModules = [
    {
      title: "Nueva Consulta",
      description: "Registrar consulta médica y diagnóstico",
      icon: Stethoscope,
      link: "/consultas/nueva",
      badge: "Rápido",
      variant: "stable" as const,
    },
    {
      title: "Agenda del Día",
      description: "Ver citas programadas y pacientes pendientes",
      icon: Calendar,
      link: "/consultas/agenda",
      badge: "12 citas",
      variant: "info" as const,
    },
    {
      title: "Expedientes",
      description: "Buscar y consultar historiales clínicos",
      icon: FileText,
      link: "/consultas/expedientes",
      badge: "Buscar",
      variant: "secondary" as const,
    },
    {
      title: "Recetas",
      description: "Generar recetas médicas y prescripciones",
      icon: Pill,
      link: "/consultas/recetas",
      badge: "Activo",
      variant: "stable" as const,
    },
    {
      title: "Laboratorio",
      description: "Solicitar estudios y ver resultados",
      icon: TestTube,
      link: "/consultas/laboratorio",
      badge: "3 pendientes",
      variant: "alert" as const,
    },
    {
      title: "Pases Médicos",
      description: "Generar pases y referencias",
      icon: ClipboardList,
      link: "/consultas/pases",
      badge: "Disponible",
      variant: "info" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Stethoscope className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Consulta Médica
              </h1>
              <p className="text-txt-muted">Dr(a). {user?.nombre_completo}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Citas Hoy</CardDescription>
              <CardTitle className="text-4xl">12</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="stable">3 completadas</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pendientes</CardDescription>
              <CardTitle className="text-4xl">9</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="alert">Próximo: 10:30</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Consultas/Mes</CardDescription>
              <CardTitle className="text-4xl">287</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="info">Promedio: 14/día</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Recetas Generadas</CardDescription>
              <CardTitle className="text-4xl">45</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Esta semana</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Módulos de Consulta */}
        <div>
          <h2 className="text-xl font-semibold text-txt-body mb-4">
            Herramientas de Consulta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicalModules.map((module) => (
              <Link key={module.link} to={module.link}>
                <Card className="h-full hover:shadow-md hover:border-brand/50 transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-subtle rounded-lg">
                        <module.icon className="size-5 text-brand" />
                      </div>
                      <Badge variant={module.variant}>{module.badge}</Badge>
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="ghost"
                      className="w-full justify-start p-0 h-auto font-normal text-brand hover:text-brand-hover"
                    >
                      Acceder →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Acceso Rápido */}
        <div className="mt-8 p-6 bg-paper border border-line-struct rounded-xl">
          <h3 className="text-lg font-semibold text-txt-body mb-4">
            Acceso Rápido
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="default" asChild>
              <Link to="/consultas/nueva">Iniciar Consulta</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/consultas/agenda">Ver Agenda</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/consultas/expedientes">Buscar Paciente</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultasPage;
