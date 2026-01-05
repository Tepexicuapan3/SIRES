/**
 * Gestión de Roles
 * Configuración de roles y asignación de permisos
 */

import { Shield, Plus, Edit, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const RolesPage = () => {
  // Mock data - se reemplazará con backend real
  const mockRoles = [
    {
      id: 1,
      nombre: "ADMINISTRADOR",
      descripcion: "Acceso total al sistema",
      usuarios: 5,
      permisos: 59,
      prioridad: 100,
      is_admin: true,
    },
    {
      id: 2,
      nombre: "GERENCIA",
      descripcion: "Reportes y dashboards gerenciales",
      usuarios: 3,
      permisos: 15,
      prioridad: 90,
      is_admin: false,
    },
    {
      id: 3,
      nombre: "MEDICOS",
      descripcion: "Consultas médicas y expedientes",
      usuarios: 45,
      permisos: 28,
      prioridad: 80,
      is_admin: false,
    },
    {
      id: 4,
      nombre: "ESPECIALISTAS",
      descripcion: "Consultas de especialidad",
      usuarios: 18,
      permisos: 22,
      prioridad: 75,
      is_admin: false,
    },
    {
      id: 5,
      nombre: "RECEPCION",
      descripcion: "Atención en recepción y citas",
      usuarios: 30,
      permisos: 12,
      prioridad: 60,
      is_admin: false,
    },
    {
      id: 6,
      nombre: "URGENCIAS",
      descripcion: "Atención de urgencias médicas",
      usuarios: 12,
      permisos: 18,
      prioridad: 70,
      is_admin: false,
    },
    {
      id: 7,
      nombre: "FARMACIA",
      descripcion: "Dispensación de medicamentos",
      usuarios: 8,
      permisos: 10,
      prioridad: 60,
      is_admin: false,
    },
    {
      id: 8,
      nombre: "HOSP-COORDINACION",
      descripcion: "Coordinación de hospitalización",
      usuarios: 4,
      permisos: 20,
      prioridad: 80,
      is_admin: false,
    },
  ];

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Shield className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Gestión de Roles
              </h1>
              <p className="text-txt-muted">
                Configurar roles y permisos del sistema RBAC 2.0
              </p>
            </div>
          </div>
          <Button>
            <Plus className="mr-2 size-4" />
            Crear Rol
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Roles</CardDescription>
              <CardTitle className="text-3xl">{mockRoles.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Permisos Disponibles</CardDescription>
              <CardTitle className="text-3xl">59</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Categorías</CardDescription>
              <CardTitle className="text-3xl">13</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Usuarios Asignados</CardDescription>
              <CardTitle className="text-3xl">125</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-brand/30 bg-brand/5">
          <CardHeader>
            <CardTitle className="text-lg">Sistema RBAC 2.0</CardTitle>
            <CardDescription>
              El sistema de roles y permisos granulares permite control de
              acceso fino a nivel de módulo y operación. Cada rol puede tener
              permisos personalizados sobre 13 categorías diferentes.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Tabla de Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Roles Configurados</CardTitle>
            <CardDescription>
              Roles activos en el sistema ordenados por prioridad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-4 bg-subtle rounded-lg hover:bg-bg-paper transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="size-12 rounded-full bg-brand/10 flex items-center justify-center">
                      <Shield className="size-5 text-brand" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-txt-body font-mono">
                          {role.nombre}
                        </p>
                        {role.is_admin && (
                          <Badge variant="critical" className="text-xs">
                            Admin
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          Prioridad {role.prioridad}
                        </Badge>
                      </div>
                      <p className="text-sm text-txt-muted mb-1">
                        {role.descripcion}
                      </p>
                      <div className="flex gap-4 text-xs text-txt-hint">
                        <span>👥 {role.usuarios} usuarios</span>
                        <span>🔑 {role.permisos} permisos</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="size-4" />
                    </Button>
                    {!role.is_admin && (
                      <Button variant="outline" size="sm">
                        <Trash2 className="size-4 text-status-critical" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categorías de Permisos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Categorías de Permisos</CardTitle>
            <CardDescription>
              13 categorías funcionales con permisos granulares
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                "EXPEDIENTES (7)",
                "USUARIOS (8)",
                "CITAS (7)",
                "CONSULTAS (7)",
                "FARMACIA (6)",
                "REPORTES (7)",
                "LABORATORIO (4)",
                "PASES (4)",
                "LICENCIAS (5)",
                "URGENCIAS (4)",
                "HOSPITAL (5)",
                "CATALOGOS (4)",
                "SISTEMA (5)",
              ].map((cat) => (
                <div
                  key={cat}
                  className="p-3 bg-subtle rounded-lg text-center text-sm font-medium text-txt-body"
                >
                  {cat}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RolesPage;
