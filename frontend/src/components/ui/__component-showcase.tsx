/**
 * 🎨 Component Showcase - Metro CDMX
 *
 * Este archivo es solo para DESARROLLO/TESTING.
 * NO importarlo en producción.
 *
 * Uso: Importá este componente en una ruta temporal para verificar
 * que todos los componentes shadcn adaptados funcionen correctamente.
 *
 * @example
 * // En Routes.tsx (temporal):
 * {
 *   path: "/showcase",
 *   element: <ComponentShowcase />
 * }
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Badge } from "./badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";
import { Label } from "./label";

export default function ComponentShowcase() {
  const [selectedRole, setSelectedRole] = useState("");

  return (
    <div className="min-h-screen bg-app p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold font-heading text-txt-body">
            Showcase de Componentes Metro CDMX
          </h1>
          <p className="text-txt-muted mt-2">
            Verificación visual de componentes shadcn adaptados al sistema de
            diseño
          </p>
        </div>

        {/* Badge Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Badge — Tags de Estado</CardTitle>
            <CardDescription>
              Variantes disponibles con tokens Metro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default (Brand)</Badge>
              <Badge variant="critical">Critical</Badge>
              <Badge variant="alert">Alert</Badge>
              <Badge variant="stable">Stable</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Select Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Select — Dropdown de Roles</CardTitle>
            <CardDescription>
              Selección con tokens Metro (bordes, focus, hover)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-w-sm">
              <Label htmlFor="rol">Rol del Usuario</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="rol">
                  <SelectValue placeholder="Seleccioná un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROL_ADMIN">Administrador</SelectItem>
                  <SelectItem value="ROL_MEDICO">Médico</SelectItem>
                  <SelectItem value="ROL_ENFERMERIA">Enfermería</SelectItem>
                  <SelectItem value="ROL_RECEPCION">Recepción</SelectItem>
                </SelectContent>
              </Select>
              {selectedRole && (
                <p className="text-sm text-txt-muted">
                  Seleccionaste: <Badge variant="outline">{selectedRole}</Badge>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialog Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Dialog — Modal de Asignación</CardTitle>
            <CardDescription>
              Modal con bg-paper-lift y focus:ring-brand
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Abrir Modal de Asignación</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar Permiso a Rol</DialogTitle>
                  <DialogDescription>
                    Este modal usa bg-paper-lift y todos los tokens Metro
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="permiso">Permiso</Label>
                    <Select>
                      <SelectTrigger id="permiso">
                        <SelectValue placeholder="Seleccioná un permiso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expedientes:read">
                          expedientes:read
                        </SelectItem>
                        <SelectItem value="expedientes:write">
                          expedientes:write
                        </SelectItem>
                        <SelectItem value="usuarios:delete">
                          usuarios:delete
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button>Asignar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Table Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Table — Listado de Roles</CardTitle>
            <CardDescription>
              Tabla con bordes line-struct y hover:bg-subtle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Roles del sistema SIRES</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">ROL_ADMIN</TableCell>
                  <TableCell>45</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>
                    <Badge variant="stable">Activo</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ROL_MEDICO</TableCell>
                  <TableCell>12</TableCell>
                  <TableCell>28</TableCell>
                  <TableCell>
                    <Badge variant="stable">Activo</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ROL_ENFERMERIA</TableCell>
                  <TableCell>8</TableCell>
                  <TableCell>42</TableCell>
                  <TableCell>
                    <Badge variant="alert">Pendiente</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">ROL_INACTIVO</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>
                    <Badge variant="critical">Bloqueado</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cards Grid Showcase */}
        <div>
          <h2 className="text-2xl font-bold font-heading text-txt-body mb-4">
            Card — Dashboard Layout
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Roles Activos</CardTitle>
                <CardDescription>Total de roles configurados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-txt-body">8</span>
                  <Badge variant="stable">+2 este mes</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Ver detalles
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permisos</CardTitle>
                <CardDescription>Permisos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-txt-body">142</span>
                  <Badge variant="info">Sistema</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Administrar
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>Usuarios con roles asignados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-txt-body">73</span>
                  <Badge variant="stable">En línea</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Ver usuarios
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Tokens Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Tokens Metro CDMX</CardTitle>
            <CardDescription>
              Referencia visual de los tokens usados en estos componentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-txt-body mb-3">
                  Colores de Marca
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-brand border border-line-struct" />
                    <div>
                      <p className="font-medium text-txt-body">bg-brand</p>
                      <p className="text-sm text-txt-muted">
                        #fe5000 (Naranja Metro)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-txt-body mb-3">
                  Estados Clínicos
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-status-critical border border-line-struct" />
                    <div>
                      <p className="font-medium text-txt-body">
                        status-critical
                      </p>
                      <p className="text-sm text-txt-muted">Errores, alertas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-status-alert border border-line-struct" />
                    <div>
                      <p className="font-medium text-txt-body">status-alert</p>
                      <p className="text-sm text-txt-muted">Advertencias</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-status-stable border border-line-struct" />
                    <div>
                      <p className="font-medium text-txt-body">status-stable</p>
                      <p className="text-sm text-txt-muted">Éxito</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
