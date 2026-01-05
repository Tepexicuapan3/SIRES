/**
 * Gestión de Catálogos
 * Configuración de catálogos del sistema (enfermedades, medicamentos, etc.)
 */

import { BookOpen, Plus, Edit, Download, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const CatalogosPage = () => {
  const mockCatalogos = [
    {
      id: 1,
      nombre: "Enfermedades CIE-10",
      descripcion: "Clasificación Internacional de Enfermedades",
      registros: 14852,
      ultima_actualizacion: "2024-11-15",
      version: "2024",
      activo: true,
    },
    {
      id: 2,
      nombre: "Medicamentos CUADRO BÁSICO",
      descripcion: "Catálogo oficial de medicamentos autorizados",
      registros: 892,
      ultima_actualizacion: "2025-01-02",
      version: "2025.1",
      activo: true,
    },
    {
      id: 3,
      nombre: "Tipos de Consulta",
      descripcion: "Clasificación de consultas médicas",
      registros: 12,
      ultima_actualizacion: "2024-08-10",
      version: "1.0",
      activo: true,
    },
    {
      id: 4,
      nombre: "Especialidades Médicas",
      descripcion: "Catálogo de especialidades disponibles",
      registros: 28,
      ultima_actualizacion: "2024-09-20",
      version: "2.1",
      activo: true,
    },
    {
      id: 5,
      nombre: "Laboratorio - Estudios",
      descripcion: "Catálogo de estudios de laboratorio",
      registros: 156,
      ultima_actualizacion: "2024-12-05",
      version: "3.4",
      activo: true,
    },
    {
      id: 6,
      nombre: "Unidades Médicas STC",
      descripcion: "Clínicas y hospitales del Metro CDMX",
      registros: 8,
      ultima_actualizacion: "2024-06-15",
      version: "1.0",
      activo: true,
    },
  ];

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <BookOpen className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Gestión de Catálogos
              </h1>
              <p className="text-txt-muted">
                Administrar catálogos maestros del sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="mr-2 size-4" />
              Importar
            </Button>
            <Button>
              <Plus className="mr-2 size-4" />
              Nuevo Catálogo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Catálogos</CardDescription>
              <CardTitle className="text-3xl">{mockCatalogos.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Registros</CardDescription>
              <CardTitle className="text-3xl">16K</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Activos</CardDescription>
              <CardTitle className="text-3xl text-status-stable">
                {mockCatalogos.filter((c) => c.activo).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Actualizados Este Mes</CardDescription>
              <CardTitle className="text-3xl text-brand">2</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mb-6 border-status-info/30 bg-status-info/5">
          <CardHeader>
            <CardTitle className="text-lg">Catálogos Maestros</CardTitle>
            <CardDescription>
              Los catálogos son fundamentales para el correcto funcionamiento
              del sistema. Mantené actualizados los catálogos de enfermedades
              (CIE-10) y medicamentos (CUADRO BÁSICO) según las normativas
              oficiales.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Lista de Catálogos */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogos Configurados</CardTitle>
            <CardDescription>
              Catálogos maestros disponibles en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCatalogos.map((catalogo) => (
                <div
                  key={catalogo.id}
                  className="flex items-center justify-between p-4 bg-subtle rounded-lg hover:bg-bg-paper transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="size-12 rounded-full bg-brand/10 flex items-center justify-center">
                      <BookOpen className="size-5 text-brand" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-txt-body">
                          {catalogo.nombre}
                        </p>
                        {catalogo.activo && (
                          <Badge variant="stable" className="text-xs">
                            Activo
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          v{catalogo.version}
                        </Badge>
                      </div>
                      <p className="text-sm text-txt-muted mb-1">
                        {catalogo.descripcion}
                      </p>
                      <div className="flex gap-4 text-xs text-txt-hint">
                        <span>
                          📊 {catalogo.registros.toLocaleString()} registros
                        </span>
                        <span>
                          🗓️ Actualizado: {catalogo.ultima_actualizacion}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Sincronizar CIE-10</CardTitle>
              <CardDescription>
                Actualizar catálogo de enfermedades desde fuente oficial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Sincronizar Ahora
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Exportar Catálogos</CardTitle>
              <CardDescription>
                Descargar catálogos en formato Excel/CSV para respaldo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 size-4" />
                Exportar Todo
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">Validar Integridad</CardTitle>
              <CardDescription>
                Verificar consistencia de datos en catálogos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ejecutar Validación
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CatalogosPage;
