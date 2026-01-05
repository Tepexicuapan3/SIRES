/**
 * Listado de Expedientes
 * Vista general de expedientes de pacientes
 */

import { useState } from "react";
import { FolderOpen, Search, Plus, Filter, Eye, Edit } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

export const ExpedientesListPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data
  const mockExpedientes = [
    {
      id: 1,
      folio: "12345678",
      paciente: "María Guadalupe Hernández Pérez",
      curp: "HEPM850315MDFRRR02",
      edad: 38,
      ultima_consulta: "2025-01-03",
      consultas_total: 24,
      status: "activo",
      alergias: true,
      cronico: true,
    },
    {
      id: 2,
      folio: "87654321",
      paciente: "José Luis García Martínez",
      curp: "GAMJ900520HDFRRS08",
      edad: 34,
      ultima_consulta: "2024-12-28",
      consultas_total: 12,
      status: "activo",
      alergias: false,
      cronico: false,
    },
    {
      id: 3,
      folio: "11223344",
      paciente: "Ana Patricia Rodríguez López",
      curp: "ROLA920815MDFPDN03",
      edad: 32,
      ultima_consulta: "2025-01-02",
      consultas_total: 8,
      status: "activo",
      alergias: true,
      cronico: false,
    },
    {
      id: 4,
      folio: "99887766",
      paciente: "Carlos Alberto Sánchez Gómez",
      curp: "SAGC780210HDFNMR05",
      edad: 46,
      ultima_consulta: "2024-10-15",
      consultas_total: 45,
      status: "inactivo",
      alergias: false,
      cronico: true,
    },
  ];

  const filteredExpedientes = mockExpedientes.filter((exp) => {
    const matchesSearch =
      exp.paciente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.folio.includes(searchQuery) ||
      exp.curp.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || exp.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <FolderOpen className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-txt-body">
                Expedientes Clínicos
              </h1>
              <p className="text-txt-muted">
                Gestión de expedientes de pacientes
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to="/expedientes/nuevo">
              <Plus className="mr-2 size-4" />
              Nuevo Expediente
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Expedientes</CardDescription>
              <CardTitle className="text-3xl">2,458</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-status-stable/30">
            <CardHeader className="pb-3">
              <CardDescription>Activos</CardDescription>
              <CardTitle className="text-3xl text-status-stable">
                2,105
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-status-alert/30">
            <CardHeader className="pb-3">
              <CardDescription>Con Padecimientos Crónicos</CardDescription>
              <CardTitle className="text-3xl text-status-alert">342</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Nuevos Este Mes</CardDescription>
              <CardTitle className="text-3xl text-brand">28</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="size-5 text-brand" />
              <CardTitle>Buscar y Filtrar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-txt-muted" />
                <Input
                  placeholder="Buscar por nombre, expediente o CURP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los expedientes</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Expedientes */}
        <Card>
          <CardHeader>
            <CardTitle>Expedientes Registrados</CardTitle>
            <CardDescription>
              {filteredExpedientes.length} expediente(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredExpedientes.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-4 bg-subtle rounded-lg hover:bg-bg-paper transition-colors border border-line-hairline"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="size-14 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="size-6 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-txt-body truncate">
                          {exp.paciente}
                        </p>
                        <Badge
                          variant={
                            exp.status === "activo" ? "stable" : "secondary"
                          }
                          className="text-xs flex-shrink-0"
                        >
                          {exp.status === "activo" ? "Activo" : "Inactivo"}
                        </Badge>
                        {exp.cronico && (
                          <Badge
                            variant="alert"
                            className="text-xs flex-shrink-0"
                          >
                            Crónico
                          </Badge>
                        )}
                        {exp.alergias && (
                          <Badge
                            variant="critical"
                            className="text-xs flex-shrink-0"
                          >
                            Alergias
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-txt-muted">
                        <span className="font-mono">{exp.folio}</span> · CURP:{" "}
                        {exp.curp}
                      </p>
                      <div className="flex gap-4 text-xs text-txt-hint mt-1">
                        <span>📅 {exp.edad} años</span>
                        <span>📋 {exp.consultas_total} consultas</span>
                        <span>🕐 Última: {exp.ultima_consulta}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/expedientes/${exp.folio}`}>
                        <Eye className="size-4" />
                      </Link>
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

        {/* Paginación */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <span className="text-sm text-txt-muted">Página 1 de 62</span>
          <Button variant="outline" size="sm">
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpedientesListPage;
