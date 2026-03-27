export interface EmpleadoExpediente {
  NO_EXP: string;
  DS_PATERNO: string | null;
  DS_MATERNO: string | null;
  DS_NOMBRE: string | null;
  CD_LABORAL: string | null;
  CVE_BAJA: string | null;
  FEC_BAJA: string | null;
  FE_NAC: string | null;
  FEC_VIG: string | null;
  PARENTESCO: string;
  CLINICA: string | null;
  ESTATUS: 'ACTIVO' | 'BAJA';
  EDAD: number | null;
  FOTO: string | null;
}

export interface FamiliarExpediente {
  NO_EXPF: string;
  PK_NUM: number;
  DS_PATERNO: string | null;
  DS_MATERNO: string | null;
  DS_NOMBRE: string | null;
  CD_PARENTESCO: string | null;
  FE_NAC: string | null;
  FEC_VIG: string | null;
  CLINICA: string | null;
  ESTATUS: 'ACTIVO' | 'NO ACTIVO';
  EDAD: number | null;
  FOTO: string | null;
}

export interface ExpedienteResponse {
  empleados: EmpleadoExpediente[];
  familiares: FamiliarExpediente[];
}

export interface ActualizarExpedienteRequest {
  expediente: string;
}

export interface SyncConteos {
  insertados: number;
  eliminados: number;
  actualizados: number;
}

export type ActualizarExpedienteResponse = Record<string, SyncConteos>;