import { useState } from "react";
import {
  LogOut,
  Bell,
  Check,
  AlertTriangle,
  Info,
  XOctagon,
  Loader2,
  MousePointerClick,
  Palette, // Icono para la sección de botones
  Shield, // Icono para RBAC
  Lock,
  Unlock,
} from "lucide-react";
import { useLogout } from "@features/auth/mutations/useLogout";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Checkbox } from "@shared/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@shared/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@shared/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@shared/ui/pagination";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@shared/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { Separator } from "@shared/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { OtpInput } from "@shared/ui/OtpInput";
import { usePermissions } from "@features/auth/queries/usePermissions";
import { PermissionGate } from "@shared/components/PermissionGate";
import { useAuthSession } from "@features/auth/queries/useAuthSession";

export const DashboardPage = () => {
  const { logoutWithToast, isPending } = useLogout();
  const { hasPermission, isAdmin, permissions } = usePermissions();
  const { data: user } = useAuthSession();
  const [roleValue, setRoleValue] = useState("");
  const [radioValue, setRadioValue] = useState("daily");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  const handlePromise = (shouldFail = false) => {
    const promise = () =>
      new Promise<{ name: string }>((resolve, reject) =>
        setTimeout(
          () => (shouldFail ? reject() : resolve({ name: "Expediente 402" })),
          2000,
        ),
      );

    toast.promise(promise, {
      loading: "Sincronizando con base de datos...",
      success: (data) => `${data.name} actualizado correctamente`,
      error: "Error de conexión: No se pudo sincronizar",
    });
  };

  return (
    <div className="min-h-screen bg-app p-6 md:p-10 animate-fade-in transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* === HEADER === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-line-struct pb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-txt-body tracking-tight">
              Dashboard / UI Kit
            </h1>
            <p className="text-txt-muted mt-1">
              Entorno de pruebas y configuración del sistema
            </p>
          </div>

          <button
            onClick={() => logoutWithToast()}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-paper border border-line-struct rounded-lg text-status-critical font-medium hover:bg-status-critical/10 transition-all active:scale-95 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="animate-spin size-4" />
            ) : (
              <LogOut size={18} />
            )}
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* === CONTENIDO PRINCIPAL === */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* COLUMNA 1: ESTADO DEL SISTEMA */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta de Info */}
            <div className="bg-paper-lift border border-line-struct rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-txt-body mb-2">
                Estado del Sistema
              </h3>
              <div className="text-xs text-txt-muted space-y-2">
                <div className="flex justify-between">
                  <span>Versión</span>
                  <span className="font-mono">v1.0.4-beta</span>
                </div>
                <div className="flex justify-between">
                  <span>Conexión</span>
                  <span className="text-status-stable flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-status-stable animate-pulse" />{" "}
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA 2-4: NOTIFICACIONES (OCUPAN EL RESTO) */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sección Notificaciones Básicas */}
            <div className="bg-paper border border-line-struct rounded-xl p-6 shadow-sm md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand/10 rounded-lg text-brand">
                  <Bell size={20} />
                </div>
                <h2 className="text-lg font-semibold text-txt-body">
                  Playground de Notificaciones
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => toast.success("Operación Exitosa")}
                  className="h-12 border border-line-struct rounded-lg flex items-center justify-center gap-2 hover:bg-status-stable/10 hover:border-status-stable transition-colors text-txt-body font-medium"
                >
                  <Check size={16} className="text-status-stable" /> Success
                </button>

                <button
                  onClick={() => toast.error("Error del Sistema")}
                  className="h-12 border border-line-struct rounded-lg flex items-center justify-center gap-2 hover:bg-status-critical/10 hover:border-status-critical transition-colors text-txt-body font-medium"
                >
                  <XOctagon size={16} className="text-status-critical" /> Error
                </button>

                <button
                  onClick={() => toast.warning("Advertencia")}
                  className="h-12 border border-line-struct rounded-lg flex items-center justify-center gap-2 hover:bg-status-alert/10 hover:border-status-alert transition-colors text-txt-body font-medium"
                >
                  <AlertTriangle size={16} className="text-status-alert" />{" "}
                  Warning
                </button>

                <button
                  onClick={() => toast.info("Información")}
                  className="h-12 border border-line-struct rounded-lg flex items-center justify-center gap-2 hover:bg-status-info/10 hover:border-status-info transition-colors text-txt-body font-medium"
                >
                  <Info size={16} className="text-status-info" /> Info
                </button>
              </div>
            </div>

            {/* Sección Detalles */}
            <div className="bg-paper border border-line-struct rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-txt-muted uppercase tracking-wider mb-4">
                Con Descripción
              </h3>
              <div className="space-y-4">
                <button
                  onClick={() =>
                    toast.success("Paciente Alta", {
                      description:
                        "El expediente 45920 ha sido cerrado correctamente.",
                    })
                  }
                  className="w-full h-12 border border-line-struct rounded-lg flex items-center px-4 hover:bg-paper-hover transition-colors text-txt-body text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-status-stable mr-3" />
                  Éxito detallado
                </button>

                <button
                  onClick={() =>
                    toast.error("Fallo de Auth", {
                      description: "Credenciales expiradas. (Código: AUTH_002)",
                    })
                  }
                  className="w-full h-12 border border-line-struct rounded-lg flex items-center px-4 hover:bg-paper-hover transition-colors text-txt-body text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-status-critical mr-3" />
                  Error detallado
                </button>
              </div>
            </div>

            {/* Sección Interactivos */}
            <div className="bg-paper border border-line-struct rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MousePointerClick size={16} className="text-brand" />
                <h3 className="text-sm font-semibold text-txt-muted uppercase tracking-wider">
                  Interacción
                </h3>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() =>
                    toast("Archivo eliminado", {
                      description: "¿Deseas recuperarlo?",
                      action: {
                        label: "Deshacer",
                        onClick: () => toast.success("Recuperado"),
                      },
                    })
                  }
                  className="w-full h-10 bg-white dark:bg-zinc-900 border border-line-struct rounded-lg text-sm hover:shadow-sm transition-all"
                >
                  Toast con Acción
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handlePromise(false)}
                    className="h-10 border border-line-struct rounded-lg text-xs hover:border-status-stable hover:text-status-stable transition-colors"
                  >
                    Simular Carga OK
                  </button>
                  <button
                    onClick={() => handlePromise(true)}
                    className="h-10 border border-line-struct rounded-lg text-xs hover:border-status-critical hover:text-status-critical transition-colors"
                  >
                    Simular Carga Error
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === SECCIÓN DE BOTONES shadcn/ui + Metro CDMX === */}
        <div className="mt-8 bg-paper border border-line-struct rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand/10 rounded-lg text-brand">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-txt-body">
                Sistema de Botones - Metro CDMX
              </h2>
              <p className="text-sm text-txt-muted">
                Componentes shadcn/ui adaptados al sistema de diseño Metro
              </p>
            </div>
          </div>

          {/* Variantes */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-medium text-txt-body mb-3">
                Variantes disponibles:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default (Brand)</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
          </div>

          {/* Tamaños */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-medium text-txt-body mb-3">
                Tamaños disponibles:
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="default">
                  Small
                </Button>
                <Button size="default" variant="default">
                  Default
                </Button>
                <Button size="lg" variant="default">
                  Large
                </Button>
              </div>
            </div>
          </div>

          {/* Con Iconos */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-medium text-txt-body mb-3">
                Con iconos:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
                <Button variant="destructive">
                  <XOctagon className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
                <Button variant="outline">
                  <Info className="mr-2 h-4 w-4" />
                  Información
                </Button>
              </div>
            </div>
          </div>

          {/* Estados */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-txt-body mb-3">Estados:</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Normal</Button>
                <Button variant="default" disabled>
                  Disabled
                </Button>
                <Button variant="outline">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              </div>
            </div>
          </div>

          {/* Nota técnica */}
          <div className="mt-6 p-4 bg-status-info/10 border border-status-info/30 rounded-lg">
            <p className="text-xs text-txt-muted">
              <strong className="text-status-info">Nota técnica:</strong> Estos
              botones usan tokens semánticos Metro CDMX (
              <code className="px-1 py-0.5 bg-paper rounded text-brand font-mono">
                bg-brand
              </code>
              ,{" "}
              <code className="px-1 py-0.5 bg-paper rounded text-status-critical font-mono">
                status-critical
              </code>
              , etc.) y NO colores hardcodeados. Se adaptan automáticamente al
              tema dark/light.
            </p>
          </div>
        </div>

        {/* === SECCIÓN DE FORMULARIOS === */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inputs y Textareas</CardTitle>
              <CardDescription>
                Estados base, deshabilitado y con error
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="dashboard-input">Input</Label>
                <Input id="dashboard-input" placeholder="Nombre completo" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dashboard-input-disabled">
                  Input deshabilitado
                </Label>
                <Input
                  id="dashboard-input-disabled"
                  placeholder="Deshabilitado"
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dashboard-input-error">Input con error</Label>
                <Input
                  id="dashboard-input-error"
                  placeholder="Error de validación"
                  aria-invalid
                />
                <span className="text-xs text-status-critical">
                  Mensaje de error
                </span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dashboard-textarea">Textarea</Label>
                <Textarea
                  id="dashboard-textarea"
                  placeholder="Notas clínicas o comentarios"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selects y Opciones</CardTitle>
              <CardDescription>
                Select, checkbox, radio group y OTP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 max-w-sm">
                <Label htmlFor="dashboard-role">Rol</Label>
                <Select value={roleValue} onValueChange={setRoleValue}>
                  <SelectTrigger id="dashboard-role">
                    <SelectValue placeholder="Seleccioná un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="medico">Médico</SelectItem>
                    <SelectItem value="recepcion">Recepción</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="dashboard-terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => {
                    setAcceptTerms(checked === true);
                  }}
                />
                <Label htmlFor="dashboard-terms">
                  Acepto términos y condiciones
                </Label>
              </div>

              <div className="grid gap-2">
                <Label>Frecuencia de reporte</Label>
                <RadioGroup
                  value={radioValue}
                  onValueChange={setRadioValue}
                  className="gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="radio-daily" value="daily" />
                    <Label htmlFor="radio-daily">Diario</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="radio-weekly" value="weekly" />
                    <Label htmlFor="radio-weekly">Semanal</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id="radio-monthly" value="monthly" />
                    <Label htmlFor="radio-monthly">Mensual</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label>OTP</Label>
                <OtpInput value={otpValue} onChange={setOtpValue} />
              </div>
            </CardContent>
            <CardFooter className="text-xs text-txt-muted">
              Selección: {roleValue || "—"} • Frecuencia: {radioValue}
            </CardFooter>
          </Card>
        </div>

        {/* === SECCIÓN DE NAVEGACIÓN Y FEEDBACK === */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Navegación</CardTitle>
              <CardDescription>Breadcrumb, tabs y paginación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Breadcrumb</Label>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Inicio</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Admin</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <Separator />

              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Resumen</TabsTrigger>
                  <TabsTrigger value="metrics">Métricas</TabsTrigger>
                  <TabsTrigger value="activity">Actividad</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="overview"
                  className="text-sm text-txt-muted"
                >
                  Vista general del módulo.
                </TabsContent>
                <TabsContent value="metrics" className="text-sm text-txt-muted">
                  Indicadores principales y KPIs.
                </TabsContent>
                <TabsContent
                  value="activity"
                  className="text-sm text-txt-muted"
                >
                  Últimos movimientos registrados.
                </TabsContent>
              </Tabs>

              <Separator />

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback y Overlays</CardTitle>
              <CardDescription>
                Alerts, badges, tooltips y dialogs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="https://i.pravatar.cc/40" alt="Avatar" />
                  <AvatarFallback>SI</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-txt-body">
                    Usuario demo
                  </p>
                  <p className="text-xs text-txt-muted">Operador</p>
                </div>
                <Badge variant="stable">Activo</Badge>
              </div>

              <Alert>
                <AlertTitle>Actualización pendiente</AlertTitle>
                <AlertDescription>
                  Hay cambios sin guardar en este formulario.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTitle>Error crítico</AlertTitle>
                <AlertDescription>
                  Falló la sincronización con el backend.
                </AlertDescription>
              </Alert>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Tooltip</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Mostrando info contextual del botón.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex flex-wrap gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Abrir Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Dialog de prueba</DialogTitle>
                      <DialogDescription>
                        Este modal usa los tokens globales del sistema.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline">Cancelar</Button>
                      <Button>Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Abrir Alert</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar acción</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Querés continuar con esta operación?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* === SECCIÓN RBAC 2.0 === */}
        <div className="mt-8 bg-paper border border-line-struct rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand/10 rounded-lg text-brand">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-txt-body">
                RBAC 2.0 - Sistema de Permisos
              </h2>
              <p className="text-sm text-txt-muted">
                Control de acceso basado en roles y permisos granulares
              </p>
            </div>
          </div>

          {/* Info del usuario */}
          <div className="mb-6 p-4 bg-subtle rounded-lg border border-line-hairline">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-txt-muted">Usuario:</span>
                <p className="font-medium text-txt-body">
                  {user?.fullName ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-txt-muted">Roles:</span>
                <p className="font-medium text-txt-body">
                  {user?.roles?.join(", ") ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-txt-muted">Admin:</span>
                <p className="font-medium text-txt-body">
                  {isAdmin() ? (
                    <span className="text-status-stable">✓ Sí</span>
                  ) : (
                    <span className="text-txt-muted">✗ No</span>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-line-hairline">
              <span className="text-txt-muted text-xs">
                Permisos ({permissions.length}):
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {permissions.slice(0, 10).map((perm) => (
                  <code
                    key={perm}
                    className="px-2 py-1 bg-paper text-xs rounded font-mono text-brand border border-line-hairline"
                  >
                    {perm}
                  </code>
                ))}
                {permissions.length > 10 && (
                  <span className="text-xs text-txt-muted self-center">
                    +{permissions.length - 10} más
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ejemplos de PermissionGate */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-txt-body mb-3">
                Ejemplo 1: Mostrar botón solo si tiene permiso
              </p>
              <div className="flex gap-3">
                <PermissionGate permission="clinico:expedientes:create">
                  <Button variant="default">
                    <Check className="mr-2 h-4 w-4" />
                    Crear Expediente
                  </Button>
                </PermissionGate>

                <PermissionGate
                  permission="clinico:expedientes:create"
                  fallback={
                    <Button variant="outline" disabled>
                      <Lock className="mr-2 h-4 w-4" />
                      Sin permiso
                    </Button>
                  }
                >
                  <Button variant="outline">
                    <Unlock className="mr-2 h-4 w-4" />
                    Con permiso
                  </Button>
                </PermissionGate>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-txt-body mb-3">
                Ejemplo 2: Hook programático
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.info(
                      hasPermission("admin:gestion:usuarios:delete")
                        ? "Tienes permiso para eliminar usuarios"
                        : "No tienes permiso para eliminar usuarios",
                    )
                  }
                >
                  Verificar: admin:gestion:usuarios:delete
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    toast.info(
                      hasPermission("clinico:consultas:create")
                        ? "Tienes permiso para crear consultas"
                        : "No tienes permiso para crear consultas",
                    )
                  }
                >
                  Verificar: clinico:consultas:create
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-txt-body mb-3">
                Ejemplo 3: Solo admins
              </p>
              <PermissionGate
                requireAdmin
                fallback={
                  <div className="p-4 bg-status-alert/10 border border-status-alert/30 rounded-lg">
                    <p className="text-sm text-txt-muted">
                      🔒 Esta sección solo es visible para administradores
                    </p>
                  </div>
                }
              >
                <div className="p-4 bg-status-stable/10 border border-status-stable/30 rounded-lg">
                  <p className="text-sm text-txt-body font-medium">
                    ✓ Panel de Administración
                  </p>
                  <p className="text-xs text-txt-muted mt-1">
                    Sos admin, podés ver esto
                  </p>
                </div>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
