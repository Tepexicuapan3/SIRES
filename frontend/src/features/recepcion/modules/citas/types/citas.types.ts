// frontend/src/features/recepcion/modules/citas/types/citas.types.ts

export type TipoPaciente = "trabajador" | "derechohabiente";

export type EstatusCita =
  | "agendada"
  | "confirmada"
  | "cancelada"
  | "atendida"
  | "no_asistio";

export interface Paciente {
  tipo: TipoPaciente;
  no_exp: number;
  pk_num: number;
  nombre_completo: string;
  cd_sexo: string;
  fe_nac: string | null;
  vigente: boolean;
  cd_clinica: number | null;
  foto_b64: string | null;
  parentesco: string | null;
}

export interface NucleoFamiliar {
  trabajador: Paciente | null;
  derechohabientes: Paciente[];
}

export interface SlotDisponible {
  id: number;
  fecha_hora: string;
  consultorio_id: number;
  centro_atencion_id: number;
}

export interface MedicoAgenda {
  id_medclin: number;
  nombre_completo: string;
  id_centro_atencion: number | null;
  id_consult: number | null;
  id_consult2: number | null;
  hr_ini: string | null;
  hr_term: string | null;
  hr_ini2: string | null;
  hr_term2: string | null;
  dias: string | null;
  est_medclin: string | null;
}

export interface ConsultorioAgenda {
  id_consult: number;
  no_consult: number | null;
  id_trno: number | null;
  id_centro_atencion: number | null;
  consult: string | null;
  est_activo: boolean | null;
}

export interface PacienteSeleccionado {
  tipo_paciente: TipoPaciente;
  no_exp: number;
  pk_num: number;
  nombre_completo: string;
  vigente: boolean;
  foto_b64: string | null;
  parentesco: string | null;
}

export interface CitaMedica {
  id: string;
  tipo_paciente: TipoPaciente;
  tipo_paciente_display: string;
  no_exp: number;
  pk_num: number;
  medico_id: number;
  centro_atencion_id: number;
  consultorio_id: number;
  fecha_hora: string;
  estatus: EstatusCita;
  estatus_display: string;
  motivo: string;
  observaciones: string;
  nombre_paciente: string;
  nombre_medico: string;
  nombre_centro: string;
  nombre_consult: string;
  creado_por: number | null;
  created_at: string;
  updated_at: string;
   foto_b64: string | null;   //Foto
}

export interface PaginatedCitas {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  results: CitaMedica[];
}

export interface CrearCitaForm {
  tipo_paciente: TipoPaciente;
  no_exp: number;
  pk_num: number;
  medico_id: number;
  centro_atencion_id: number;
  consultorio_id: number;
  fecha_hora: string;
  motivo: string;
  email_notificacion: string;
}

export interface FiltrosCitas {
  fecha?: string;
  centro_atencion_id?: number;
  medico_id?: number;
  estatus?: EstatusCita;
  no_exp?: number;
  busqueda?: string;
  page?: number;
  page_size?: number;
}