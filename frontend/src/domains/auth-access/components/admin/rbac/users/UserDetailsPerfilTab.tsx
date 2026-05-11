import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Skeleton } from "@shared/ui/skeleton";
import { CatalogCombobox, type CatalogOption } from "@/domains/auth-access/components/admin/rbac/users/CatalogCombobox";
import { useUserPerfil, useUpdateUserPerfil } from "@/domains/auth-access/hooks/rbac/users/useUserPerfil";
import { useEspecialidadesList } from "@features/admin/modules/catalogos/especialidades/queries/useEspecialidadesList";
import type {
  TipoPersonal,
  PerfilMedico,
  PerfilEnfermeria,
  PerfilAdministrativo,
} from "@api/types";

interface UserDetailsPerfilTabProps {
  userId: number;
  tipoPersonal: TipoPersonal;
  isEditable?: boolean;
  areaClinicaOptions?: CatalogOption[];
}

// ─── FORMULARIO MÉDICO ───────────────────────────────────────────────────────

interface MedicoState {
  cedulaProfesional: string;
  cedulaEspecialidad: string;
  especialidadId: number | null;
  tipoAdscripcion: string;
}

function PerfilMedicoForm({
  data,
  especialidades,
  isEditable,
  onChange,
}: {
  data: MedicoState;
  especialidades: CatalogOption[];
  isEditable: boolean;
  onChange: (patch: Partial<MedicoState>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Cédula profesional</Label>
        <Input
          value={data.cedulaProfesional}
          onChange={(e) => onChange({ cedulaProfesional: e.target.value })}
          placeholder="Ej. 1234567"
          disabled={!isEditable}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Cédula de especialidad</Label>
        <Input
          value={data.cedulaEspecialidad}
          onChange={(e) => onChange({ cedulaEspecialidad: e.target.value })}
          placeholder="Ej. 7654321"
          disabled={!isEditable}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Especialidad</Label>
        <CatalogCombobox
          value={data.especialidadId}
          onChange={(v) => onChange({ especialidadId: v })}
          options={especialidades}
          disabled={!isEditable}
          placeholder="Selecciona especialidad"
          emptyLabel="Sin especialidad"
          searchPlaceholder="Buscar especialidad..."
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Tipo de adscripción</Label>
        <Select
          value={data.tipoAdscripcion}
          onValueChange={(v) => onChange({ tipoAdscripcion: v === "none" ? "" : v })}
          disabled={!isEditable}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecciona tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin adscripción</SelectItem>
            <SelectItem value="CLINICA">Clínica</SelectItem>
            <SelectItem value="HOSPITAL">Hospital</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── FORMULARIO ENFERMERÍA ───────────────────────────────────────────────────

interface EnfermeriaState {
  cedulaEnfermeria: string;
  nivel: string;
  areaClinicaId: number | null;
}

function PerfilEnfermeriaForm({
  data,
  areaClinicaOptions,
  isEditable,
  onChange,
}: {
  data: EnfermeriaState;
  areaClinicaOptions: CatalogOption[];
  isEditable: boolean;
  onChange: (patch: Partial<EnfermeriaState>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Cédula de enfermería</Label>
        <Input
          value={data.cedulaEnfermeria}
          onChange={(e) => onChange({ cedulaEnfermeria: e.target.value })}
          placeholder="Ej. 1234567"
          disabled={!isEditable}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Nivel</Label>
        <Select
          value={data.nivel}
          onValueChange={(v) => onChange({ nivel: v === "none" ? "" : v })}
          disabled={!isEditable}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecciona nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin nivel</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="ESPECIALISTA">Especialista</SelectItem>
            <SelectItem value="JEFE_PISO">Jefe de Piso</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-xs">Área clínica</Label>
        <CatalogCombobox
          value={data.areaClinicaId}
          onChange={(v) => onChange({ areaClinicaId: v })}
          options={areaClinicaOptions}
          disabled={!isEditable}
          placeholder="Selecciona área clínica"
          emptyLabel="Sin área clínica"
          searchPlaceholder="Buscar área..."
        />
      </div>
    </div>
  );
}

// ─── FORMULARIO ADMINISTRATIVO ───────────────────────────────────────────────

interface AdminState {
  puesto: string;
  areaAdministrativa: string;
}

function PerfilAdminForm({
  data,
  isEditable,
  onChange,
}: {
  data: AdminState;
  isEditable: boolean;
  onChange: (patch: Partial<AdminState>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Puesto</Label>
        <Input
          value={data.puesto}
          onChange={(e) => onChange({ puesto: e.target.value })}
          placeholder="Ej. Coordinador administrativo"
          disabled={!isEditable}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Área administrativa</Label>
        <Input
          value={data.areaAdministrativa}
          onChange={(e) => onChange({ areaAdministrativa: e.target.value })}
          placeholder="Ej. Recursos Humanos"
          disabled={!isEditable}
        />
      </div>
    </div>
  );
}

// ─── TAB PRINCIPAL ───────────────────────────────────────────────────────────

export function UserDetailsPerfilTab({
  userId,
  tipoPersonal,
  isEditable = true,
  areaClinicaOptions = [],
}: UserDetailsPerfilTabProps) {
  const { data: perfilData, isLoading } = useUserPerfil(userId, true);
  const updatePerfil = useUpdateUserPerfil(userId);

  const { data: especialidadesData } = useEspecialidadesList(
    { pageSize: 100, isActive: true },
    { enabled: tipoPersonal === "MEDICO" },
  );
  const especialidades: CatalogOption[] = (especialidadesData?.items ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    isActive: e.isActive,
  }));

  // Estado local del form
  const [medicoState, setMedicoState] = useState<MedicoState>({
    cedulaProfesional: "",
    cedulaEspecialidad: "",
    especialidadId: null,
    tipoAdscripcion: "",
  });
  const [enfermeriaState, setEnfermeriaState] = useState<EnfermeriaState>({
    cedulaEnfermeria: "",
    nivel: "",
    areaClinicaId: null,
  });
  const [adminState, setAdminState] = useState<AdminState>({
    puesto: "",
    areaAdministrativa: "",
  });

  // Sincroniza estado cuando llegan los datos del servidor
  useEffect(() => {
    if (!perfilData?.perfil) return;
    if (tipoPersonal === "MEDICO") {
      const p = perfilData.perfil as PerfilMedico;
      setMedicoState({
        cedulaProfesional: p.cedulaProfesional ?? "",
        cedulaEspecialidad: p.cedulaEspecialidad ?? "",
        especialidadId: p.especialidad?.id ?? null,
        tipoAdscripcion: p.tipoAdscripcion ?? "",
      });
    } else if (tipoPersonal === "ENFERMERIA") {
      const p = perfilData.perfil as PerfilEnfermeria;
      setEnfermeriaState({
        cedulaEnfermeria: p.cedulaEnfermeria ?? "",
        nivel: p.nivel ?? "",
        areaClinicaId: p.areaClinica?.id ?? null,
      });
    } else if (tipoPersonal === "ADMINISTRATIVO") {
      const p = perfilData.perfil as PerfilAdministrativo;
      setAdminState({
        puesto: p.puesto ?? "",
        areaAdministrativa: p.areaAdministrativa ?? "",
      });
    }
  }, [perfilData, tipoPersonal]);

  const handleSave = async () => {
    try {
      if (tipoPersonal === "MEDICO") {
        await updatePerfil.mutateAsync({
          cedulaProfesional: medicoState.cedulaProfesional || null,
          cedulaEspecialidad: medicoState.cedulaEspecialidad || null,
          especialidadId: medicoState.especialidadId,
          tipoAdscripcion: (medicoState.tipoAdscripcion as "CLINICA" | "HOSPITAL") || null,
        });
      } else if (tipoPersonal === "ENFERMERIA") {
        await updatePerfil.mutateAsync({
          cedulaEnfermeria: enfermeriaState.cedulaEnfermeria || null,
          nivel: (enfermeriaState.nivel as "GENERAL" | "ESPECIALISTA" | "JEFE_PISO") || null,
          areaClinicaId: enfermeriaState.areaClinicaId,
        });
      } else if (tipoPersonal === "ADMINISTRATIVO") {
        await updatePerfil.mutateAsync({
          puesto: adminState.puesto || null,
          areaAdministrativa: adminState.areaAdministrativa || null,
        });
      }
      toast.success("Perfil profesional guardado.");
    } catch {
      toast.error("No se pudo guardar el perfil profesional.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  const TIPO_LABELS: Record<TipoPersonal, string> = {
    MEDICO: "Médico",
    ENFERMERIA: "Enfermería",
    ADMINISTRATIVO: "Administrativo",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
          Perfil — {TIPO_LABELS[tipoPersonal]}
        </p>
        {isEditable ? (
          <Button
            type="button"
            size="sm"
            className="h-8 gap-2"
            disabled={updatePerfil.isPending}
            onClick={() => void handleSave()}
          >
            {updatePerfil.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Guardar perfil
          </Button>
        ) : null}
      </div>

      {tipoPersonal === "MEDICO" ? (
        <PerfilMedicoForm
          data={medicoState}
          especialidades={especialidades}
          isEditable={isEditable}
          onChange={(patch) => setMedicoState((s) => ({ ...s, ...patch }))}
        />
      ) : tipoPersonal === "ENFERMERIA" ? (
        <PerfilEnfermeriaForm
          data={enfermeriaState}
          areaClinicaOptions={areaClinicaOptions}
          isEditable={isEditable}
          onChange={(patch) => setEnfermeriaState((s) => ({ ...s, ...patch }))}
        />
      ) : (
        <PerfilAdminForm
          data={adminState}
          isEditable={isEditable}
          onChange={(patch) => setAdminState((s) => ({ ...s, ...patch }))}
        />
      )}
    </div>
  );
}
