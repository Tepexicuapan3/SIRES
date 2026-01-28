/**
 * Panel de Administración
 * Landing page para usuarios con rol ADMINISTRADOR
 */

import {
  Activity,
  BookOpen,
  Database,
  FileText,
  FolderOpen,
  Key,
  Shield,
  Users,
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
import { useAuthSession } from "@features/auth/queries/useAuthSession";
import { Link } from "react-router-dom";

export const AdminPage = () => {
  const { data: user } = useAuthSession();

  const adminModules = [
    {
      title: "Usuarios",
      description: "Gestion y control de cuentas de usuario",
      icon: Users,
      link: "/admin/usuarios",
      badge: "Activo",
      variant: "stable" as const,
    },
    {
      title: "Expedientes de derechohabientes",
      description: "Expedientes administrativos de derechohabientes",
      icon: FolderOpen,
      link: "/admin/expedientes-derechohabientes",
      badge: "En desarrollo",
      variant: "alert" as const,
    },
    {
      title: "Roles",
      description: "Roles y permisos para acceso seguro",
      icon: Shield,
      link: "/admin/roles",
      badge: "RBAC",
      variant: "info" as const,
    },
    {
      title: "Catalogos",
      description: "Catalogos base y configuracion del sistema",
      icon: BookOpen,
      link: "/admin/catalogos",
      badge: "Activo",
      variant: "stable" as const,
    },
    {
      title: "Reportes",
      description: "Reportes operativos y ejecutivos",
      icon: FileText,
      link: "/admin/reportes",
      badge: "En desarrollo",
      variant: "alert" as const,
    },
    {
      title: "Estadisticas",
      description: "Analitica administrativa y KPIs",
      icon: Activity,
      link: "/admin/estadisticas",
      badge: "En desarrollo",
      variant: "alert" as const,
    },
    {
      title: "Autorizacion",
      description: "Autorizacion de recetas y estudios",
      icon: Shield,
      link: "/admin/autorizacion/recetas",
      badge: "En desarrollo",
      variant: "alert" as const,
    },
    {
      title: "Licencias",
      description: "Control de licencias y permisos",
      icon: Key,
      link: "/admin/licencias",
      badge: "En desarrollo",
      variant: "alert" as const,
    },
    {
      title: "Conciliacion",
      description: "Conciliacion de registros internos",
      icon: Database,
      link: "/admin/conciliacion",
      badge: "En desarrollo",
      variant: "alert" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Shield className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Panel de Administración
              </h1>
              <p className="text-txt-muted">
                Bienvenido, {user?.nombre_completo}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Usuarios Activos</CardDescription>
              <CardTitle className="text-4xl">142</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="stable">+12 este mes</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Roles Configurados</CardDescription>
              <CardTitle className="text-4xl">8</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="info">RBAC 2.0</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Permisos Totales</CardDescription>
              <CardTitle className="text-4xl">59</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">13 categorías</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Sesiones Activas</CardDescription>
              <CardTitle className="text-4xl">23</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="alert">En tiempo real</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Módulos Administrativos */}
        <div>
          <h2 className="text-xl font-semibold text-txt-body mb-4">
            Módulos Administrativos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminModules.map((module) => (
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
            <Button variant="outline" asChild>
              <Link to="/admin/usuarios/nuevo">Crear Usuario</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/catalogos">Catalogos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/reportes">Reportes</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Ir al Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
