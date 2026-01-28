import { useMemo } from "react";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Shield,
  Clock,
  Edit,
  CheckCircle,
  Ban,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClinics } from "../../hooks/useClinics";
import type { UserDetail } from "@api/types";

/**
 * UserDetailCard - Card con información completa del usuario
 *
 * SECCIONES:
 * 1. Información Básica: Foto + Usuario + Nombre + Correo + Estado
 * 2. Última Sesión: Fecha/hora + IP
 * 3. Auditoría: Quién lo creó + cuándo, quién lo modificó + cuándo
 * 4. Acciones: Editar, Activar/Desactivar
 *
 * FILOSOFÍA:
 * - Componente de presentación pura (no fetch data)
 * - Usa tipos del backend directamente (paterno, materno, est_usuario, etc.)
 * - Muestra datos de auditoría para trazabilidad
 * - Callbacks para acciones (editar, activar, desactivar)
 *
 * PROPS:
 * - user: UserDetail (incluye auditoría: usr_alta, fch_alta, usr_modf, fch_modf)
 * - onEdit?: () => void - Callback para editar usuario
 * - onActivate?: () => void - Callback para activar usuario
 * - onDeactivate?: () => void - Callback para desactivar usuario
 */

interface UserDetailCardProps {
  user: UserDetail;
  onEdit?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export function UserDetailCard({
  user,
  onEdit,
  onActivate,
  onDeactivate,
}: UserDetailCardProps) {
  // ============================================================
  // QUERY - Cargar clínicas
  // ============================================================
  const { data: clinicas = [] } = useClinics();

  /**
   * Buscar la clínica asignada al usuario
   */
  const clinicaUsuario = useMemo(() => {
    if (!user.id_clin) return null;
    return clinicas.find((c) => c.id_clin === user.id_clin);
  }, [user.id_clin, clinicas]);

  // ============================================================
  // ESTADO Y HELPERS
  // ============================================================
  // HELPERS - FORMATEO
  // ============================================================

  /**
   * Construir nombre completo
   */
  const fullName = `${user.nombre} ${user.paterno} ${user.materno}`;

  /**
   * Estado activo/inactivo
   */
  const isActive = user.est_usuario === "A";
  const statusConfig = isActive
    ? { label: "Activo", className: "bg-status-stable text-white" }
    : { label: "Inactivo", className: "bg-txt-muted text-white" };

  /**
   * Formatear fecha legible
   * Formato: "15 Ene 2025, 10:30"
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";

    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  /**
   * Imagen de perfil genérica (no hay campo img_perfil en BD)
   */
  const profileImage = (
    <div className="h-24 w-24 rounded-full bg-brand flex items-center justify-center border-4 border-white shadow-lg">
      <UserIcon className="h-12 w-12 text-white" />
    </div>
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-line-struct overflow-hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-brand to-brand-hover h-24" />

      {/* Contenido principal */}
      <div className="px-6 pb-6">
        {/* Foto de perfil superpuesta al header */}
        <div className="flex items-start gap-6 -mt-12 mb-6">
          {profileImage}
          <div className="mt-16 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-txt-body">{fullName}</h2>
                <p className="text-txt-muted font-mono">@{user.usuario}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
                {/* Botón Editar */}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ========== INFORMACIÓN BÁSICA ========== */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-txt-body uppercase tracking-wide">
              Información Básica
            </h3>

            {/* Correo */}
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-brand mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-txt-muted">Correo Electrónico</p>
                <p className="font-medium text-txt-body">{user.correo}</p>
              </div>
            </div>

            {/* Expediente */}
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-brand mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-txt-muted">Número de Expediente</p>
                <p className="font-medium text-txt-body font-mono">
                  {user.expediente || "No asignado"}
                </p>
              </div>
            </div>

            {/* Clínica */}
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-brand mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-txt-muted">Clínica Asignada</p>
                <p className="font-medium text-txt-body">
                  {clinicaUsuario ? (
                    <>
                      {clinicaUsuario.clinica}
                      <span className="text-txt-muted ml-2">
                        ({clinicaUsuario.folio_clin})
                      </span>
                    </>
                  ) : (
                    <span className="text-txt-muted italic">
                      Sin clínica asignada
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Última Sesión */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-brand mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-txt-muted">Última Sesión</p>
                <p className="font-medium text-txt-body">
                  {formatDate(user.last_conexion)}
                </p>
                {user.ip_ultima && (
                  <p className="text-xs text-txt-hint font-mono mt-1">
                    IP: {user.ip_ultima}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ========== AUDITORÍA ========== */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-txt-body uppercase tracking-wide">
              Auditoría
            </h3>

            {/* Creación */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-brand mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-txt-muted">Fecha de Alta</p>
                <p className="font-medium text-txt-body">
                  {formatDate(user.fch_alta)}
                </p>
                <p className="text-xs text-txt-hint mt-1">
                  Creado por usuario #{user.usr_alta}
                </p>
              </div>
            </div>

            {/* Última modificación */}
            {user.fch_modf && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-brand mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-txt-muted">Última Modificación</p>
                  <p className="font-medium text-txt-body">
                    {formatDate(user.fch_modf)}
                  </p>
                  {user.usr_modf && (
                    <p className="text-xs text-txt-hint mt-1">
                      Modificado por usuario #{user.usr_modf}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Flags de seguridad */}
            <div className="pt-4 border-t border-line-hairline space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-txt-muted">Términos Aceptados</span>
                <Badge
                  variant={user.terminos_acept ? "default" : "secondary"}
                  className={
                    user.terminos_acept ? "bg-status-stable" : "bg-status-alert"
                  }
                >
                  {user.terminos_acept ? "Sí" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-txt-muted">Debe Cambiar Contraseña</span>
                <Badge
                  variant={user.cambiar_clave ? "default" : "secondary"}
                  className={
                    user.cambiar_clave ? "bg-status-alert" : "bg-status-stable"
                  }
                >
                  {user.cambiar_clave ? "Sí" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción: Activar/Desactivar */}
      {(onActivate || onDeactivate) && (
        <div className="mb-6 flex gap-3">
          {isActive && onDeactivate && (
            <Button
              variant="outline"
              onClick={onDeactivate}
              className="gap-2 border-status-alert text-status-alert hover:bg-status-alert/10"
            >
              <Ban className="h-4 w-4" />
              Desactivar Usuario
            </Button>
          )}
          {!isActive && onActivate && (
            <Button
              variant="outline"
              onClick={onActivate}
              className="gap-2 border-status-stable text-status-stable hover:bg-status-stable/10"
            >
              <CheckCircle className="h-4 w-4" />
              Activar Usuario
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
