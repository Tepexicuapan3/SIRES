/**
 * Listado de Usuarios
 * Vista completa de usuarios del sistema con filtros y acciones
 */

import { useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
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
import { Link } from "react-router-dom";

export const UsersListPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data (esto se reemplazará con useQuery cuando el backend esté listo)
  const mockUsers = [
    {
      id: 1,
      usuario: "admin01",
      nombre_completo: "Juan Carlos García López",
      expediente: "12345678",
      rol: "ADMINISTRADOR",
      activo: true,
      ultima_sesion: "2025-01-05 09:30",
    },
    {
      id: 2,
      usuario: "dr.martinez",
      nombre_completo: "María Fernanda Martínez Ruiz",
      expediente: "87654321",
      rol: "MEDICOS",
      activo: true,
      ultima_sesion: "2025-01-05 08:15",
    },
    {
      id: 3,
      usuario: "recep01",
      nombre_completo: "Laura Patricia Hernández",
      expediente: "11223344",
      rol: "RECEPCION",
      activo: true,
      ultima_sesion: "2025-01-04 18:45",
    },
    {
      id: 4,
      usuario: "dr.inactive",
      nombre_completo: "Pedro Sánchez Gómez",
      expediente: "99887766",
      rol: "ESPECIALISTAS",
      activo: false,
      ultima_sesion: "2024-12-20 14:20",
    },
  ];

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.usuario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.expediente.includes(searchQuery),
  );

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Users className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Gestión de Usuarios
              </h1>
              <p className="text-txt-muted">
                Administrar cuentas de usuario del sistema
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to="/admin/usuarios/nuevo">
              <UserPlus className="mr-2 size-4" />
              Crear Usuario
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Usuarios</CardDescription>
              <CardTitle className="text-3xl">142</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Activos</CardDescription>
              <CardTitle className="text-3xl text-status-stable">128</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Inactivos</CardDescription>
              <CardTitle className="text-3xl text-txt-muted">14</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Sesiones Hoy</CardDescription>
              <CardTitle className="text-3xl text-brand">23</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-txt-muted" />
              <Input
                placeholder="Buscar por nombre, usuario o expediente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Registrados</CardTitle>
            <CardDescription>
              {filteredUsers.length} usuario(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-subtle rounded-lg hover:bg-bg-paper transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-brand/10 flex items-center justify-center">
                      <Users className="size-5 text-brand" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-txt-body">
                          {user.nombre_completo}
                        </p>
                        {user.activo ? (
                          <Badge variant="stable" className="text-xs">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-txt-muted">
                        <span className="font-mono">{user.usuario}</span> · Exp:{" "}
                        {user.expediente} · Rol: {user.rol}
                      </p>
                      <p className="text-xs text-txt-hint">
                        Última sesión: {user.ultima_sesion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="size-4" />
                    </Button>
                    {user.activo ? (
                      <Button variant="outline" size="sm">
                        <Ban className="size-4 text-status-alert" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <CheckCircle className="size-4 text-status-stable" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Trash2 className="size-4 text-status-critical" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersListPage;
