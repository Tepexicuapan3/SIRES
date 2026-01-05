/**
 * Configuración del Sistema
 * Parámetros globales y configuraciones de la aplicación
 */

import {
  Settings,
  Save,
  RotateCcw,
  Mail,
  Lock,
  Database,
  Clock,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ConfigPage = () => {
  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Settings className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Configuración del Sistema
              </h1>
              <p className="text-txt-muted">
                Parámetros globales y ajustes de la aplicación
              </p>
            </div>
          </div>
          <Badge variant="alert">En desarrollo</Badge>
        </div>

        {/* Configuración General */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
            <CardDescription>
              Parámetros básicos del sistema SIRES
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_sistema">Nombre del Sistema</Label>
                <Input
                  id="nombre_sistema"
                  defaultValue="SIRES - Sistema Integral de Registros de Salud"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Versión</Label>
                <Input id="version" defaultValue="2.0.0-beta" disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Select defaultValue="america_mexico">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america_mexico">
                      América/Ciudad_de_México (UTC-6)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idioma">Idioma del Sistema</Label>
                <Select defaultValue="es_mx">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es_mx">Español (México)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad y Autenticación */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="size-5 text-brand" />
              <CardTitle>Seguridad y Autenticación</CardTitle>
            </div>
            <CardDescription>
              Configuración de políticas de seguridad JWT + CSRF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_timeout">
                  <Clock className="inline size-4 mr-1" />
                  Tiempo de Sesión (minutos)
                </Label>
                <Input
                  id="session_timeout"
                  type="number"
                  defaultValue="60"
                  placeholder="60"
                />
                <p className="text-xs text-txt-muted">
                  Duración del access_token JWT (HttpOnly cookie)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="refresh_timeout">Refresh Token (días)</Label>
                <Input
                  id="refresh_timeout"
                  type="number"
                  defaultValue="30"
                  placeholder="30"
                />
                <p className="text-xs text-txt-muted">
                  Duración del refresh_token antes de re-login
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_attempts">Intentos de Login Máximos</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  defaultValue="5"
                  placeholder="5"
                />
                <p className="text-xs text-txt-muted">
                  Bloqueo temporal después de N intentos fallidos
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lockout_duration">
                  Duración de Bloqueo (minutos)
                </Label>
                <Input
                  id="lockout_duration"
                  type="number"
                  defaultValue="15"
                  placeholder="15"
                />
              </div>
            </div>

            <div className="p-4 bg-status-info/10 border border-status-info/30 rounded-lg">
              <p className="text-sm text-txt-body">
                <strong>🔒 Seguridad Actual:</strong> JWT en cookies HttpOnly +
                CSRF token en header X-CSRF-TOKEN. No usar localStorage para
                tokens.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Email */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="size-5 text-brand" />
              <CardTitle>Servidor de Correo (SMTP)</CardTitle>
            </div>
            <CardDescription>
              Configuración para envío de emails (OTP, notificaciones)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">Host SMTP</Label>
                <Input
                  id="smtp_host"
                  placeholder="smtp.gmail.com"
                  defaultValue="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">Puerto</Label>
                <Input id="smtp_port" defaultValue="587" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_user">Usuario SMTP</Label>
                <Input
                  id="smtp_user"
                  type="email"
                  placeholder="sistema@metro.cdmx.gob.mx"
                  defaultValue="sires.metro@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_pass">Contraseña / App Password</Label>
                <Input
                  id="smtp_pass"
                  type="password"
                  placeholder="••••••••••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from_email">Email Remitente</Label>
              <Input
                id="from_email"
                type="email"
                placeholder="noreply@metro.cdmx.gob.mx"
                defaultValue="SIRES Metro CDMX <sires.metro@gmail.com>"
              />
            </div>
          </CardContent>
        </Card>

        {/* Base de Datos */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="size-5 text-brand" />
              <CardTitle>Base de Datos</CardTitle>
            </div>
            <CardDescription>
              Información de conexión a MySQL (solo lectura)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Host</Label>
                <Input defaultValue="10.15.15.76" disabled />
              </div>
              <div className="space-y-2">
                <Label>Puerto</Label>
                <Input defaultValue="3306" disabled />
              </div>
              <div className="space-y-2">
                <Label>Base de Datos</Label>
                <Input defaultValue="SIRES" disabled />
              </div>
            </div>

            <div className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-lg">
              <p className="text-sm text-txt-body">
                <strong>⚠️ Advertencia:</strong> La configuración de base de
                datos se maneja desde variables de entorno (.env). No modificar
                desde UI.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex gap-3">
          <Button className="flex-1">
            <Save className="mr-2 size-4" />
            Guardar Configuración
          </Button>
          <Button variant="outline">
            <RotateCcw className="mr-2 size-4" />
            Restaurar Valores por Defecto
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;
