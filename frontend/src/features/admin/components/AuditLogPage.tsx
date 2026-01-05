/**
 * Logs de Auditoría
 * Registro completo de eventos y acciones del sistema
 */

import {
  Activity,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
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
import { useState } from "react";

export const AuditLogPage = () => {
  const [filterType, setFilterType] = useState<string>("all");

  // Mock data - se reemplazará con backend real
  const mockLogs = [
    {
      id: 1,
      timestamp: "2025-01-05 10:45:32",
      usuario: "admin01",
      accion: "LOGIN_SUCCESS",
      categoria: "AUTH",
      ip: "192.168.1.45",
      detalles: "Login exitoso desde navegador Chrome",
      nivel: "info",
    },
    {
      id: 2,
      timestamp: "2025-01-05 10:44:18",
      usuario: "dr.martinez",
      accion: "CREATE_EXPEDIENTE",
      categoria: "EXPEDIENTES",
      ip: "192.168.1.87",
      detalles: "Creó expediente #12345678 para paciente Juan Pérez",
      nivel: "info",
    },
    {
      id: 3,
      timestamp: "2025-01-05 10:42:05",
      usuario: "sistema",
      accion: "PASSWORD_RESET_SENT",
      categoria: "AUTH",
      ip: "10.15.15.76",
      detalles: "OTP enviado a usuario recep01@metro.cdmx.gob.mx",
      nivel: "info",
    },
    {
      id: 4,
      timestamp: "2025-01-05 10:40:22",
      usuario: "dr.lopez",
      accion: "LOGIN_FAILED",
      categoria: "AUTH",
      ip: "192.168.1.102",
      detalles:
        "Intento de login fallido - contraseña incorrecta (intento 2/5)",
      nivel: "warning",
    },
    {
      id: 5,
      timestamp: "2025-01-05 10:38:15",
      usuario: "admin01",
      accion: "UPDATE_USER_ROLE",
      categoria: "USUARIOS",
      ip: "192.168.1.45",
      detalles: "Cambió rol de usuario 'recep02' de RECEPCION a RECOEX",
      nivel: "alert",
    },
    {
      id: 6,
      timestamp: "2025-01-05 10:35:08",
      usuario: "farm01",
      accion: "DISPENSE_MEDICATION",
      categoria: "FARMACIA",
      ip: "192.168.1.200",
      detalles: "Dispensó receta #R-2025-00342 - Paracetamol 500mg x20",
      nivel: "info",
    },
    {
      id: 7,
      timestamp: "2025-01-05 10:30:44",
      usuario: "sistema",
      accion: "DB_BACKUP_SUCCESS",
      categoria: "SISTEMA",
      ip: "10.15.15.76",
      detalles: "Respaldo automático de BD completado (2.4 GB)",
      nivel: "stable",
    },
    {
      id: 8,
      timestamp: "2025-01-05 10:28:12",
      usuario: "unknown",
      accion: "UNAUTHORIZED_ACCESS",
      categoria: "SEGURIDAD",
      ip: "203.45.67.89",
      detalles: "Intento de acceso a /admin/usuarios sin token JWT",
      nivel: "critical",
    },
  ];

  const nivelStyles = {
    info: "bg-status-info/10 text-status-info border-status-info/30",
    warning: "bg-status-alert/10 text-status-alert border-status-alert/30",
    alert: "bg-status-alert/20 text-status-alert border-status-alert/50",
    stable: "bg-status-stable/10 text-status-stable border-status-stable/30",
    critical:
      "bg-status-critical/10 text-status-critical border-status-critical/30",
  };

  const filteredLogs =
    filterType === "all"
      ? mockLogs
      : mockLogs.filter((log) => log.categoria === filterType);

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Activity className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Logs de Auditoría
              </h1>
              <p className="text-txt-muted">
                Registro completo de eventos y acciones del sistema
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 size-4" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 size-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Eventos</CardDescription>
              <CardTitle className="text-2xl">8,542</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Últimas 24h</CardDescription>
              <CardTitle className="text-2xl">342</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-status-critical/30">
            <CardHeader className="pb-3">
              <CardDescription>Críticos</CardDescription>
              <CardTitle className="text-2xl text-status-critical">3</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-status-alert/30">
            <CardHeader className="pb-3">
              <CardDescription>Alertas</CardDescription>
              <CardTitle className="text-2xl text-status-alert">12</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-status-stable/30">
            <CardHeader className="pb-3">
              <CardDescription>Exitosos</CardDescription>
              <CardTitle className="text-2xl text-status-stable">327</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="size-5 text-brand" />
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="AUTH">Autenticación</SelectItem>
                    <SelectItem value="EXPEDIENTES">Expedientes</SelectItem>
                    <SelectItem value="USUARIOS">Usuarios</SelectItem>
                    <SelectItem value="FARMACIA">Farmacia</SelectItem>
                    <SelectItem value="SEGURIDAD">Seguridad</SelectItem>
                    <SelectItem value="SISTEMA">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                <Input id="fecha_inicio" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha Fin</Label>
                <Input id="fecha_fin" type="date" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerta de Eventos Críticos */}
        {filteredLogs.some((log) => log.nivel === "critical") && (
          <Card className="mb-6 border-status-critical/50 bg-status-critical/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-status-critical" />
                <CardTitle className="text-lg text-status-critical">
                  Eventos Críticos Detectados
                </CardTitle>
              </div>
              <CardDescription>
                Se detectaron{" "}
                {filteredLogs.filter((l) => l.nivel === "critical").length}{" "}
                eventos críticos que requieren atención inmediata
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Tabla de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Eventos</CardTitle>
            <CardDescription>
              {filteredLogs.length} evento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    nivelStyles[log.nivel as keyof typeof nivelStyles] ||
                    "bg-subtle"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.categoria}
                      </Badge>
                      <span className="font-mono text-xs text-txt-muted">
                        {log.timestamp}
                      </span>
                    </div>
                    <Badge
                      variant={
                        log.nivel === "critical"
                          ? "critical"
                          : log.nivel === "alert"
                            ? "alert"
                            : log.nivel === "warning"
                              ? "alert"
                              : log.nivel === "stable"
                                ? "stable"
                                : "info"
                      }
                      className="text-xs"
                    >
                      {log.nivel.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="font-semibold text-txt-body mb-1">
                    {log.accion}
                  </p>
                  <p className="text-sm text-txt-muted mb-2">{log.detalles}</p>

                  <div className="flex gap-4 text-xs text-txt-hint">
                    <span>👤 {log.usuario}</span>
                    <span>🌐 {log.ip}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Paginación (placeholder) */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <span className="text-sm text-txt-muted">Página 1 de 10</span>
          <Button variant="outline" size="sm">
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
